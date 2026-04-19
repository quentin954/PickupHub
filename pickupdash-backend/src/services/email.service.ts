import { ImapFlow } from 'imapflow';
import { google } from 'googleapis';
import { prisma } from '../config/database';
import { encrypt, decrypt } from '../utils/crypto';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, IMAP_CONFIG } from '../config/config';
import { NotFoundError, BadRequestError, InternalServerError } from '../errors/errors';
import { parseChronopostEmail, parseMondialRelayEmail, parseVintedGoEmail } from '../parsers';
import type { ParsedPackageData } from '../types/email-parser.types';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export const EmailService = {
  async getGoogleAuthUrl(): Promise<{ authUrl: string }> {
    const scopes = ['https://mail.google.com/', 'https://www.googleapis.com/auth/gmail.readonly'];
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
    return { authUrl };
  },

  async handleGoogleCallback(userId: string, code: string): Promise<{ message: string; email: string }> {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new InternalServerError('Failed to exchange code for tokens.');
    }

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let emailAddress = '';
    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      emailAddress = profile.data.emailAddress || '';
    } catch (error) {
      throw new InternalServerError('Failed to link Gmail account.');
    }

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000);

    const existing = await prisma.emailAccount.findUnique({ where: { userId } });

    if (existing) {
      await prisma.emailAccount.update({
        where: { userId },
        data: {
          provider: 'gmail',
          emailAddress: emailAddress,
          encryptedAccessToken: encrypt(tokens.access_token),
          encryptedRefreshToken: encrypt(tokens.refresh_token || ''),
          expiresAt,
        },
      });
    } else {
      await prisma.emailAccount.create({
        data: {
          userId,
          provider: 'gmail',
          emailAddress: emailAddress,
          encryptedAccessToken: encrypt(tokens.access_token),
          encryptedRefreshToken: encrypt(tokens.refresh_token || ''),
          expiresAt,
        },
      });
    }

    return { message: 'Gmail account linked successfully.', email: emailAddress };
  },

  async linkEmailWithImap(userId: string, provider: string, email: string, password: string): Promise<{ message: string; provider: string; email: string }> {
    const imapConfig = IMAP_CONFIG[provider as keyof typeof IMAP_CONFIG];
    if (!imapConfig) {
      throw new BadRequestError('Invalid provider. Allowed: outlook, hotmail, yahoo');
    }

    const client = new ImapFlow({
      host: imapConfig.host,
      port: imapConfig.port,
      secure: true,
      auth: { user: email, pass: password },
    });

    try {
      await client.connect();
      await client.logout();
    } catch (error) {
      throw new BadRequestError('Failed to connect. Check your credentials.');
    }

    const existing = await prisma.emailAccount.findUnique({ where: { userId } });

    if (existing) {
      await prisma.emailAccount.update({
        where: { userId },
        data: {
          provider,
          emailAddress: email,
          encryptedPassword: encrypt(password),
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
          expiresAt: null,
        },
      });
    } else {
      await prisma.emailAccount.create({
        data: {
          userId,
          provider,
          emailAddress: email,
          encryptedPassword: encrypt(password),
        },
      });
    }

    return { message: 'Email account linked successfully.', provider, email };
  },

  async unlinkEmail(userId: string): Promise<{ message: string }> {
    const existing = await prisma.emailAccount.findUnique({ where: { userId } });

    if (!existing) {
      throw new NotFoundError('Email account');
    }

    await prisma.emailAccount.delete({ where: { userId } });

    return { message: 'Email account unlinked successfully.' };
  },

  async searchEmails(
    userId: string,
    trackingCode: string
  ): Promise<{ emails: Array<{ id: string; subject: string; from: string; date: string; html: string }> }> {
    const emailAccount = await prisma.emailAccount.findUnique({ where: { userId } });

    if (!emailAccount) {
      return { emails: [] };
    }

    const emails: Array<{ id: string; subject: string; from: string; date: string; html: string }> = [];

    let imapClient: ImapFlow;

    if (emailAccount.provider === 'gmail') {
      const accessToken = decrypt(emailAccount.encryptedAccessToken || '');

      if (emailAccount.expiresAt && new Date(emailAccount.expiresAt) < new Date()) {
        const newTokens = await this.refreshGmailToken(decrypt(emailAccount.encryptedRefreshToken || ''));
        await prisma.emailAccount.update({
          where: { userId },
          data: {
            encryptedAccessToken: encrypt(newTokens.access_token),
            expiresAt: new Date(newTokens.expiry_date),
          },
        });
      }

      imapClient = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user: emailAccount.emailAddress, accessToken },
        logger: false
      });
    } else if (emailAccount.provider === 'outlook' || emailAccount.provider === 'hotmail' || emailAccount.provider === 'yahoo') {
      const imapConfig = IMAP_CONFIG[emailAccount.provider as keyof typeof IMAP_CONFIG];
      if (!imapConfig) return { emails: [] };

      const password = decrypt(emailAccount.encryptedPassword || '');

      imapClient = new ImapFlow({
        host: imapConfig.host,
        port: imapConfig.port,
        secure: true,
        auth: { user: emailAccount.emailAddress, pass: password },
      });
    } else {
      return { emails: [] };
    }

    try {
      await imapClient.connect();
      const lock = await imapClient.getMailboxLock('INBOX');
      try {
        const uids = (await imapClient.search({ subject: trackingCode })) as number[];
        if (uids && uids.length > 0) {
          let messages = await imapClient.fetchAll(uids, {
            envelope: true,
            source: true
          }, { uid: true });
          for (let message of messages) {
            if (message.source) {
              const source = message.source.toString();
              if (source.includes('<html') || source.includes('<HTML')) {
                emails.push({
                  id: String(message.uid),
                  subject: message.envelope?.subject || '',
                  from: message.envelope?.from?.[0]?.address || '',
                  date: message.envelope?.date?.toString() || '',
                  html: source,
                });
                break;
              }
            }
          }
        }
      } finally {
        lock.release();
      }
      await imapClient.logout();
    } catch (error) {
      console.error('Failed to search emails:', error);
    }

    return { emails };
  },

  parseEmailByCarrier(html: string, carrierCode: string): ParsedPackageData | null {
    if (carrierCode === 'CHRONOPOST') {
      return parseChronopostEmail(html);
    } else if (carrierCode === 'MONDIAL') {
      return parseMondialRelayEmail(html);
    } else if (carrierCode === 'VINTEDGO-SHOP-FR') {
      return parseVintedGoEmail(html);
    }
    return null;
  },

  async refreshGmailToken(refreshToken: string): Promise<{ access_token: string; expiry_date: number }> {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return {
      access_token: credentials.access_token || '',
      expiry_date: credentials.expiry_date || 0,
    };
  },
};
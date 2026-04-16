import { ImapFlow } from 'imapflow';
import { google } from 'googleapis';
import { prisma } from '../config/database';
import { encrypt } from '../utils/crypto';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, IMAP_CONFIG } from '../config/config';
import { NotFoundError, BadRequestError, InternalServerError } from '../errors/errors';

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
};
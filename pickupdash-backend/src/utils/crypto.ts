import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { BCRYPT_ROUNDS } from '../constants/defaults';

const getEncryptionKey = (): Buffer => {
  const key = process.env['ENCRYPTION_KEY'];
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return Buffer.from(key, 'hex');
};

const IV_LENGTH = 16;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted: string = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (encryptedText: string): string => {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0] as string, 'hex');
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted: string = decipher.update(parts[1] as string, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

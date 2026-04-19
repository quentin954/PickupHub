import dotenv from 'dotenv';
dotenv.config();

export const NODE_ENV = process.env['NODE_ENV'] || 'development';
export const PORT = process.env['PORT'] || 3000;
export const DATABASE_URL = process.env['DATABASE_URL'];

export const JWT_ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'];
export const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'];
export const JWT_ACCESS_EXPIRES_IN = process.env['JWT_ACCESS_EXPIRES_IN'] || '15m';
export const JWT_REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';

export const PLATFORM_API_URL = process.env['PLATFORM_API_URL'] || '';
export const PLATFORM_USER_AGENT = process.env['PLATFORM_USER_AGENT'] || '';
export const PLATFORM_DEVICE_UUID = process.env['PLATFORM_DEVICE_UUID'] || '';

export const GOOGLE_CLIENT_ID = process.env['GOOGLE_CLIENT_ID'];
export const GOOGLE_CLIENT_SECRET = process.env['GOOGLE_CLIENT_SECRET'];
export const GOOGLE_REDIRECT_URI = process.env['GOOGLE_REDIRECT_URI'] || 'http://localhost:3000/api/emails/oauth/callback';

export const IMAP_CONFIG = {
  outlook: { host: 'outlook.office365.com', port: 993 },
  hotmail: { host: 'outlook.office365.com', port: 993 },
  yahoo: { host: 'imap.mail.yahoo.com', port: 993 },
  gmail: { host: 'imap.gmail.com', port: 993 },
};
import dotenv from 'dotenv';
dotenv.config();

export const NODE_ENV = process.env['NODE_ENV'] || 'development';
export const PORT = process.env['PORT'] || 3000;
export const DATABASE_URL = process.env['DATABASE_URL'];

export const JWT_ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'];
export const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'];
export const JWT_ACCESS_EXPIRES_IN = process.env['JWT_ACCESS_EXPIRES_IN'] || '15m';
export const JWT_REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';

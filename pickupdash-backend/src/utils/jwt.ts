import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config/config';

const ACCESS_SECRET: Secret = JWT_ACCESS_SECRET ?? '';
const REFRESH_SECRET: Secret = JWT_REFRESH_SECRET ?? '';

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be defined in environment variables');
}

type TokenExpiresIn = '15m' | '30m' | '1h' | '7d' | '30d';

const parseExpiresIn = (value: string | undefined, fallback: TokenExpiresIn): TokenExpiresIn => {
  const validValues: TokenExpiresIn[] = ['15m', '30m', '1h', '7d', '30d'];
  if (value && validValues.includes(value as TokenExpiresIn)) {
    return value as TokenExpiresIn;
  }
  return fallback;
};

export const generateAccessToken = (userId: string): string => {
  const expiresIn = parseExpiresIn(JWT_ACCESS_EXPIRES_IN, '15m');
  return jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn });
};

export const generateRefreshToken = (userId: string): string => {
  const expiresIn = parseExpiresIn(JWT_REFRESH_EXPIRES_IN, '7d');
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
};

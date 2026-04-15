import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../constants/defaults';

export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_ATTEMPTS,
  message: { message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.API_WINDOW_MS,
  max: RATE_LIMIT.API_MAX_REQUESTS,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

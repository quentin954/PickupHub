import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/errors';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types/request.types';

export const protect = (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new UnauthorizedError('No token provided.'));
  }

  try {
    const decoded = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = { id: decoded['id'] as string };
    next();
  } catch (_err) {
    return next(new UnauthorizedError('Invalid or expired token.'));
  }
};
import { Request, Response, NextFunction } from 'express';
import { NODE_ENV } from '../config/config';
import { CustomError } from '../errors/errors';
import { log } from '../utils/logger';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  log('error', err.message, { stack: NODE_ENV === 'development' ? err.stack : undefined });

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ success: false, errors: err.serializeErrors() });
  }

  return res.status(500).json({
    success: false,
    errors: [{ message: NODE_ENV === 'development' ? err.message : 'Something went very wrong!', code: 'INTERNAL_SERVER_ERROR', stack: NODE_ENV === 'development' ? err.stack : undefined }],
  });
};
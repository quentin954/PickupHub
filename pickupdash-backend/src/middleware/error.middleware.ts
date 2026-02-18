import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { NODE_ENV } from '../config';

const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('ERROR', err);

  let statusCode = 500;
  let status = 'error';
  let message = 'Something went very wrong!';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
  }

  return res.status(statusCode).json({
    status: status,
    message: message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;

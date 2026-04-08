import { Request, Response, NextFunction } from 'express';
import { z, ZodIssue } from 'zod';
import { ValidationError } from '../errors/errors';

export const validate = (schema: { body?: z.ZodObject<z.ZodRawShape>; query?: z.ZodObject<z.ZodRawShape>; params?: z.ZodObject<z.ZodRawShape> }) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: { field: string; message: string }[] = [];

    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (!result.success) {
        result.error.issues.forEach((issue: ZodIssue) => errors.push({ field: `body.${issue.path.join('.')}`, message: issue.message }));
      } else {
        req.body = result.data;
      }
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) {
        result.error.issues.forEach((issue: ZodIssue) => errors.push({ field: `query.${issue.path.join('.')}`, message: issue.message }));
      } else {
        req.query = result.data as typeof req.query;
      }
    }

    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) {
        result.error.issues.forEach((issue: ZodIssue) => errors.push({ field: `params.${issue.path.join('.')}`, message: issue.message }));
      } else {
        req.params = result.data as typeof req.params;
      }
    }

    if (errors.length > 0) return next(new ValidationError(errors));
    next();
  };
};
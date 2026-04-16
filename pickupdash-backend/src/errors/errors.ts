export interface SerializedError {
  message: string;
  code: string;
  field?: string;
}

export abstract class CustomError extends Error {
  abstract statusCode: number;
  abstract errorCode: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  abstract serializeErrors(): SerializedError[];
}

export class BadRequestError extends CustomError {
  statusCode = 400;
  errorCode = 'BAD_REQUEST';

  constructor(public override message: string) {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.errorCode }];
  }
}

export class NotFoundError extends CustomError {
  statusCode = 404;
  errorCode = 'RESOURCE_NOT_FOUND';

  constructor(public resourceName: string = 'Resource') {
    super(`${resourceName} not found.`);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.errorCode }];
  }
}

export class UnauthorizedError extends CustomError {
  statusCode = 401;
  errorCode = 'UNAUTHORIZED';

  constructor(public override message: string = 'Not authorized.') {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.errorCode }];
  }
}

export class ForbiddenError extends CustomError {
  statusCode = 403;
  errorCode = 'FORBIDDEN';

  constructor(public override message: string = 'Permission denied.') {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.errorCode }];
  }
}

export class ValidationError extends CustomError {
  statusCode = 400;
  errorCode = 'VALIDATION_ERROR';

  constructor(public errors: { message: string; field: string }[]) {
    super('Invalid input data.');
  }

  serializeErrors() {
    return this.errors.map(err => ({
      message: err.message,
      code: this.errorCode,
      field: err.field
    }));
  }
}

export class ConflictError extends CustomError {
  statusCode = 409;
  errorCode = 'CONFLICT';

  constructor(public override message: string) {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.errorCode }];
  }
}

export class InternalServerError extends CustomError {
  statusCode = 500;
  errorCode = 'INTERNAL_SERVER_ERROR';

  constructor(public override message: string = 'Internal server error.') {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.errorCode }];
  }
}
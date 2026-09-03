import { NextFunction, Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

/**
 * Middleware to handle validation errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);

      if (errors.isEmpty()) {
        next();
        return;
      }

      next(new AppError('Validation failed', 400, true));
    } catch (error) {
      next(error);
    }
  };
};

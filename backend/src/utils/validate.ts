import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import { plainToInstance } from "class-transformer";
import { validate as classValidate, ValidationError } from "class-validator";
import { ApiError } from "./ApiError";

function flattenErrors(errors: ValidationError[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const error of errors) {
    if (error.constraints) {
      result[error.property] = Object.values(error.constraints);
    }
    if (error.children && error.children.length > 0) {
      const nested = flattenErrors(error.children);
      Object.assign(result, nested);
    }
  }
  return result;
}

export function validateDto<T extends object>(dtoClass: new () => T) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const instance = plainToInstance(dtoClass, req.body);
    const errors = await classValidate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: false,
      validationError: { target: false },
    });
    if (errors.length > 0) {
      return next(ApiError.badRequest("Dados inválidos", flattenErrors(errors)));
    }
    req.body = instance;
    next();
  };
}

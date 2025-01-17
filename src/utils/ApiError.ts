import { ValidationError } from 'express-validator'

export class ApiError extends Error {
  public status: number
  public details?: Record<string, any>

  constructor(message: string, status: number, details?: Record<string, any>) {
    super(message)
    this.status = status
    this.details = details
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  static badRequest(message: string, details?: Record<string, any>) {
    return new ApiError(message, 400, details)
  }

  static notFound(message: string, details?: Record<string, any>) {
    return new ApiError(message, 404, details)
  }

  static validation(errors: ValidationError[]) {
    return new ApiError('Validation Error', 400, { errors })
  }

  static internal(message: string, details?: Record<string, any>) {
    return new ApiError(message, 500, details)
  }
}

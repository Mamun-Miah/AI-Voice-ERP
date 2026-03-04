import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorType = 'UnknownError';

    // 1. Handle NestJS HttpExceptions (Manual throws like Forbidden, NotFound)
    if (exception instanceof HttpException) {
      status = exception.getStatus();

      // FIX: Cast the response to a record or unknown first to satisfy ESLint
      const res = exception.getResponse() as
        | string
        | { message?: string | string[] };

      message = typeof res === 'object' ? res.message || 'Error' : res;
      errorType = exception.name;
    }

    // 2. Handle Prisma Known Request Errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      errorType = 'PrismaRequestError';
      switch (exception.code) {
        case 'P2002': {
          // Unique constraint
          status = HttpStatus.CONFLICT;
          const target =
            (exception.meta?.target as string[])?.join(', ') || 'field';
          message = `Duplicate entry: ${target} already exists.`;
          break;
        }
        case 'P2025': // Record not found
          status = HttpStatus.NOT_FOUND;
          message = 'The requested record was not found or access denied.';
          break;
        case 'P2003': // Foreign key constraint
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed: invalid related ID.';
          break;
        default:
          message = `Database error: ${exception.code}`;
          break;
      }
    }

    // 3. Handle Prisma Validation Errors (e.g., passing string to Int field)
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      errorType = 'PrismaValidationError';
      message =
        'Database validation failed. Ensure your data types are correct.';
    }

    // LOGGING (Using Pino via Nest Logger)
    // We log the method, URL, status, and the stack trace for 500 errors
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${errorType}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    // Final Response Structure
    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message, // Returns first error if it's an array
      error: errorType,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

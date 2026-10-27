import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorBody, ApiErrorCode } from '@buffetya/shared';
import type { Response } from 'express';
import { DomainError, type DomainErrorCode } from '../../domain/errors.js';

const DOMAIN_STATUS: Readonly<Record<DomainErrorCode, number>> = {
  INVALID_REQUEST: HttpStatus.BAD_REQUEST,
  UNKNOWN_PRODUCT: HttpStatus.UNPROCESSABLE_ENTITY,
  PRODUCT_UNAVAILABLE: HttpStatus.CONFLICT,
  ORDER_NOT_FOUND: HttpStatus.NOT_FOUND,
  PRODUCT_NOT_FOUND: HttpStatus.NOT_FOUND,
  ILLEGAL_TRANSITION: HttpStatus.CONFLICT,
  PAYMENT_NOT_ALLOWED: HttpStatus.CONFLICT,
};

function codeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'INVALID_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'BACKSTAGE_DISABLED';
    default:
      return 'INTERNAL';
  }
}

function messageOf(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(' ');
  return typeof message === 'string' ? message : exception.message;
}

/** Every API error leaves as `ApiErrorBody`, so the frontend handles one shape. */
export function toErrorBody(exception: unknown): ApiErrorBody {
  if (exception instanceof DomainError) {
    return {
      statusCode: DOMAIN_STATUS[exception.code],
      code: exception.code,
      message: exception.message,
      ...(exception.productIds ? { productIds: exception.productIds } : {}),
    };
  }
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    return { statusCode, code: codeForStatus(statusCode), message: messageOf(exception) };
  }
  // Errors raised by Express middleware (e.g. a malformed JSON body) carry a status.
  const status = (exception as { status?: unknown } | null)?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return { statusCode: status, code: codeForStatus(status), message: 'Solicitud inválida.' };
  }
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL',
    message: 'Algo salió mal. Probá de nuevo en unos segundos.',
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Api');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = toErrorBody(exception);
    if (body.statusCode >= 500) {
      this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : exception);
    }
    // A live SSE stream already sent its headers: just close it.
    if (response.headersSent) {
      response.end();
      return;
    }
    response.status(body.statusCode).json(body);
  }
}

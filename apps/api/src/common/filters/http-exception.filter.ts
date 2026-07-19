import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Default values
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      // res can be string or object
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && (res as any).message) {
        // message can be an array or string
        const m = (res as any).message;
        message = Array.isArray(m) ? m.join(', ') : String(m);
      } else {
        message = JSON.stringify(res);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log all server-side errors (5xx) so they appear in Render logs
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}: ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

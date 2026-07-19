import { Catch, RpcExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class LogRpcExceptionFilter implements RpcExceptionFilter<any> {
  private readonly logger = new Logger('RpcExceptionFilter');

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    // Ignore harmless browser favicon requests to avoid log spam
    if (exception.response?.message === 'Cannot GET /favicon.ico') {
      return throwError(() => exception);
    }

    this.logger.error(`❌ RPC/Microservice Error caught:`);
    if (exception.response) {
      this.logger.error(JSON.stringify(exception.response, null, 2));
    } else {
      this.logger.error(exception.stack || exception.message || exception);
    }
    
    // MQTT/one-way patterns do not have a response stream, but we return a throwError for standard RPC handlers
    return throwError(() => exception.getError ? exception.getError() : exception);
  }
}

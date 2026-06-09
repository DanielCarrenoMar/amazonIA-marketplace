import { RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class LogRpcExceptionFilter implements RpcExceptionFilter<any> {
    private readonly logger;
    catch(exception: any, host: ArgumentsHost): Observable<any>;
}

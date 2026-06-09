import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Simple API key guard for authenticating IoT devices and simulators.
 *
 * Devices send the key in the `x-api-key` header. The expected value
 * is configured via the INGESTOR_API_KEY environment variable.
 *
 * This is a lightweight alternative to JWT for machine-to-machine auth
 * where token rotation and user identity are not needed.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string | undefined;
    const expectedKey = this.config.get<string>('INGESTOR_API_KEY');

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}

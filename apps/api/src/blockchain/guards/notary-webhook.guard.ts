import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotaryWebhookGuard implements CanActivate {
  private readonly logger = new Logger(NotaryWebhookGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedApiKey = request.headers['x-api-key'];

    // Mismo secreto compartido que la API usa como NOTARY_API_KEY al llamar al notario
    const validApiKey = this.configService.get<string>('NOTARY_API_KEY');

    if (!validApiKey) {
      this.logger.error('CRÍTICO: No hay NOTARY_API_KEY configurada en el entorno de la API.');
      throw new UnauthorizedException('Servicio mal configurado');
    }

    if (!providedApiKey) {
      throw new UnauthorizedException('API Key no proporcionada (Header: x-api-key)');
    }

    if (providedApiKey !== validApiKey) {
      this.logger.warn('Intento de acceso denegado al webhook de blockchain: API Key inválida.');
      throw new UnauthorizedException('API Key inválida');
    }

    return true;
  }
}

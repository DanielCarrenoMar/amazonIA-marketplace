import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedApiKey = request.headers['x-api-key'];
    
    // Obtenemos la API key esperada desde las variables de entorno
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!validApiKey) {
      this.logger.error('CRÍTICO: No hay API_KEY configurada en el entorno del microservicio.');
      throw new UnauthorizedException('Servicio mal configurado');
    }

    if (!providedApiKey) {
      throw new UnauthorizedException('API Key no proporcionada (Header: x-api-key)');
    }

    if (providedApiKey !== validApiKey) {
      this.logger.warn(`Intento de acceso denegado. API Key inválida recibida.`);
      throw new UnauthorizedException('API Key inválida');
    }

    return true;
  }
}

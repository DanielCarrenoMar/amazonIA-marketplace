import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InferenceService {
  private readonly logger = new Logger(InferenceService.name);
  private readonly inferenceUrl: string;

  constructor(private configService: ConfigService) {
    this.inferenceUrl = this.configService.get<string>('INFERENCE_SERVICE_URL', 'http://inference-service:8000');
  }

  async getSpatialRisk(lat: number, lon: number, transportType: string = 'terrestre', productType: string = 'perecedero_bajo') {
    try {
      const url = `${this.inferenceUrl}/api/v1/risk/spatial?lat=${lat}&lon=${lon}&transport_type=${transportType}&product_type=${productType}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Inference service returned status ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error(`Failed to get spatial risk: ${error.message}`);
      // Devuelve un riesgo nulo o fallback gracefully
      return null;
    }
  }
}

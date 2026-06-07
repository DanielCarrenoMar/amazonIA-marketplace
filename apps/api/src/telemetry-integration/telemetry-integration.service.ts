import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { ShipmentEventDocument, ShipmentEventDocumentType } from 'database';
import { IoTEventType } from 'event-types';
import { CircuitBreaker, CircuitState } from './circuit-breaker';
import { ShipmentEventDto } from '../product-order/dto/order-detail-with-telemetry.dto';

@Injectable()
export class TelemetryIntegrationService {
  private readonly logger = new Logger(TelemetryIntegrationService.name);
  private readonly circuitBreaker: CircuitBreaker;
  private readonly timeoutMs: number;

  constructor(
    @InjectModel(ShipmentEventDocument.name)
    private readonly shipmentModel: Model<ShipmentEventDocumentType>,
    private readonly config: ConfigService,
  ) {
    const failureThreshold = Number(config.get('CB_FAILURE_THRESHOLD', '3'));
    const cooldownMs = Number(config.get('CB_COOLDOWN_MS', '30000'));
    this.timeoutMs = Number(config.get('MONGODB_TIMEOUT_MS', '5000'));

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold,
      cooldownMs,
      onStateChange: (from, to) => this.logTransition(from, to, cooldownMs),
    });

    this.logger.log(
      `Initialized — failureThreshold=${failureThreshold}, cooldownMs=${cooldownMs}, timeoutMs=${this.timeoutMs}`,
    );
  }

  /**
   * Fetch telemetry events for a given tracking number.
   * Returns null when: no tracking number, circuit is OPEN, MongoDB times out, or any error occurs.
   */
  async getShipmentTelemetry(
    trackingNumber: string | null,
    limit = 20,
  ): Promise<ShipmentEventDto[] | null> {
    if (!trackingNumber) return null;

    const state = this.circuitBreaker.currentState;
    if (state === CircuitState.OPEN) {
      this.logger.debug(
        `Circuit OPEN — skipping MongoDB query for tracking ${trackingNumber}`,
      );
    }

    return this.circuitBreaker.execute(() =>
      this.queryWithTimeout(trackingNumber, limit),
    );
  }

  get circuitState(): CircuitState {
    return this.circuitBreaker.currentState;
  }

  private async queryWithTimeout(
    trackingNumber: string,
    limit: number,
  ): Promise<ShipmentEventDto[]> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`MongoDB query timed out after ${this.timeoutMs}ms`)),
        this.timeoutMs,
      ),
    );

    const query = this.shipmentModel
      .find({ 'metadata.tracking_number': trackingNumber })
      .sort({ recorded_at: -1 })
      .limit(limit)
      .lean()
      .exec();

    const docs = await Promise.race([query, timeout]);

    return docs.map((doc) => ({
      event_id: doc.event_id,
      event_type: doc.event_type as IoTEventType,
      recorded_at: (doc.recorded_at as Date).toISOString(),
      ingested_at: (doc.ingested_at as Date).toISOString(),
      metadata: doc.metadata,
      location: doc.location,
      business_context: doc.business_context,
      telemetry: doc.telemetry,
    }));
  }

  private logTransition(from: CircuitState, to: CircuitState, cooldownMs: number): void {
    const messages: Record<string, string> = {
      [`${CircuitState.CLOSED}→${CircuitState.OPEN}`]:
        `Circuit OPENED — MongoDB failures exceeded threshold. Bypassing for ${cooldownMs}ms`,
      [`${CircuitState.OPEN}→${CircuitState.HALF_OPEN}`]:
        'Circuit HALF-OPEN — sending probe request to MongoDB',
      [`${CircuitState.HALF_OPEN}→${CircuitState.CLOSED}`]:
        'Circuit CLOSED — MongoDB recovered, resuming normal operation',
      [`${CircuitState.HALF_OPEN}→${CircuitState.OPEN}`]:
        `Circuit re-OPENED — probe failed. Bypassing MongoDB for another ${cooldownMs}ms`,
    };

    const msg = messages[`${from}→${to}`] ?? `Circuit transition: ${from} → ${to}`;
    this.logger.warn(msg);
  }
}

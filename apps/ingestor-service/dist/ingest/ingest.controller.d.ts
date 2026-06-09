import { IngestService } from './ingest.service';
import { CreateClimateEventDto, CreateShipmentEventDto } from 'event-types';
export declare class IngestController {
    private readonly ingestService;
    private readonly logger;
    constructor(ingestService: IngestService);
    handleMqttClimateEvent(dto: CreateClimateEventDto): Promise<void>;
    handleMqttShipmentEvent(dto: CreateShipmentEventDto): Promise<void>;
    handleMqttShipmentBatchEvent(dtos: CreateShipmentEventDto[]): Promise<void>;
}

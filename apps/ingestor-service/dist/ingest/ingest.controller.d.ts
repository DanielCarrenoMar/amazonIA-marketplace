import { IngestService } from './ingest.service';
import { CreateClimateEventDto, CreateShipmentEventDto } from 'event-types';
export declare class IngestController {
    private readonly ingestService;
    private readonly logger;
    constructor(ingestService: IngestService);
    ingestClimate(dto: CreateClimateEventDto): Promise<{
        accepted: boolean;
        event_id: string;
    }>;
    ingestShipment(dto: CreateShipmentEventDto): Promise<{
        accepted: boolean;
        event_id: string;
    }>;
    ingestClimateBatch(dtos: CreateClimateEventDto[]): Promise<{
        accepted: boolean;
        count: number;
    }>;
    ingestShipmentBatch(dtos: CreateShipmentEventDto[]): Promise<{
        accepted: boolean;
        count: number;
    }>;
    handleMqttClimateEvent(dto: CreateClimateEventDto): Promise<void>;
    handleMqttShipmentEvent(dto: CreateShipmentEventDto): Promise<void>;
    handleMqttShipmentBatchEvent(dtos: CreateShipmentEventDto[]): Promise<void>;
}

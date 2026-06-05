import { CreateClimateEventDto, CreateShipmentEventDto, IClimateEvent, IShipmentEvent } from 'event-types';
export declare class IngestService {
    private readonly logger;
    private readonly producer;
    constructor();
    publishClimateEvent(dto: CreateClimateEventDto): Promise<IClimateEvent>;
    publishClimateEventBatch(dtos: CreateClimateEventDto[]): Promise<IClimateEvent[]>;
    publishShipmentEvent(dto: CreateShipmentEventDto): Promise<IShipmentEvent>;
    publishShipmentEventBatch(dtos: CreateShipmentEventDto[]): Promise<IShipmentEvent[]>;
    private enrichClimateEvent;
    private enrichShipmentEvent;
}

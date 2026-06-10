import { IMessageProducer } from 'messaging';
import { CreateClimateEventDto, CreateShipmentEventDto, IClimateEvent, IShipmentEvent } from 'event-types';
export declare class IngestService {
    private readonly producer;
    private readonly logger;
    constructor(producer: IMessageProducer);
    publishClimateEvent(dto: CreateClimateEventDto): Promise<IClimateEvent>;
    publishClimateEventBatch(dtos: CreateClimateEventDto[]): Promise<IClimateEvent[]>;
    publishShipmentEvent(dto: CreateShipmentEventDto): Promise<IShipmentEvent>;
    publishShipmentEventBatch(dtos: CreateShipmentEventDto[]): Promise<IShipmentEvent[]>;
    private enrichClimateEvent;
    private enrichShipmentEvent;
}

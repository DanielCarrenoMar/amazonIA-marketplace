import { IMessageProducer } from 'messaging';
import { CreateClimateEventDto, RawSensorPayloadDto, IClimateEvent, IShipmentEvent } from 'event-types';
import { DbService } from './db.service';
export declare class IngestService {
    private readonly producer;
    private readonly db;
    private readonly logger;
    private sensorCache;
    constructor(producer: IMessageProducer, db: DbService);
    publishClimateEvent(dto: CreateClimateEventDto): Promise<IClimateEvent>;
    publishClimateEventBatch(dtos: CreateClimateEventDto[]): Promise<IClimateEvent[]>;
    publishShipmentEvent(dto: RawSensorPayloadDto): Promise<IShipmentEvent | null>;
    publishShipmentEventBatch(dtos: RawSensorPayloadDto[]): Promise<IShipmentEvent[]>;
    private enrichClimateEvent;
    private resolveShipmentContext;
    private enrichShipmentEvent;
}

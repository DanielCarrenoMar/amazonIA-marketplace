import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { ClimateEventDocument, ShipmentEventDocument } from 'database';
export declare class WorkerService implements OnModuleInit {
    private readonly config;
    private readonly climateModel;
    private readonly shipmentModel;
    private readonly logger;
    private consumer;
    private pollIntervalMs;
    constructor(config: ConfigService, climateModel: Model<ClimateEventDocument>, shipmentModel: Model<ShipmentEventDocument>);
    onModuleInit(): void;
    pollKafka(): Promise<void>;
    private consumeClimateEvents;
    private consumeShipmentEvents;
    private calculateAvgLatency;
}

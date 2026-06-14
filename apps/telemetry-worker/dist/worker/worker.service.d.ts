import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { IMessageConsumer } from 'messaging';
import { ClimateEventDocument, ShipmentEventDocument } from 'database';
export declare class WorkerService implements OnModuleInit {
    private readonly config;
    private readonly climateModel;
    private readonly shipmentModel;
    private readonly consumer;
    private readonly logger;
    private pollIntervalMs;
    constructor(config: ConfigService, climateModel: Model<ClimateEventDocument>, shipmentModel: Model<ShipmentEventDocument>, consumer: IMessageConsumer);
    onModuleInit(): void;
    pollStreams(): Promise<void>;
    private consumeClimateEvents;
    private consumeShipmentEvents;
    private stripNulls;
    private calculateAvgLatency;
}

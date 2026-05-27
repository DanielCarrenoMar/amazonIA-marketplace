import { HydratedDocument } from 'mongoose';
export type ShipmentEventDocumentType = HydratedDocument<ShipmentEventDocument>;
export declare class ShipmentEventDocument {
    event_id: string;
    event_type: string;
    recorded_at: Date;
    ingested_at: Date;
    metadata: Record<string, string>;
    location: {
        type: string;
        coordinates: [number, number];
    };
    business_context: Record<string, string>;
    telemetry: Record<string, number>;
}
export declare const ShipmentEventSchema: import("mongoose").Schema<ShipmentEventDocument, import("mongoose").Model<ShipmentEventDocument, any, any, any, import("mongoose").Document<unknown, any, ShipmentEventDocument, any, {}> & ShipmentEventDocument & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ShipmentEventDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ShipmentEventDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ShipmentEventDocument> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

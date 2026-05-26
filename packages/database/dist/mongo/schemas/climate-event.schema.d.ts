import { HydratedDocument } from 'mongoose';
export type ClimateEventDocumentType = HydratedDocument<ClimateEventDocument>;
export declare class ClimateEventDocument {
    event_id: string;
    event_type: string;
    recorded_at: Date;
    ingested_at: Date;
    metadata: Record<string, string>;
    location: {
        type: string;
        coordinates: [number, number];
    };
    telemetry: Record<string, number>;
}
export declare const ClimateEventSchema: import("mongoose").Schema<ClimateEventDocument, import("mongoose").Model<ClimateEventDocument, any, any, any, import("mongoose").Document<unknown, any, ClimateEventDocument, any, {}> & ClimateEventDocument & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ClimateEventDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ClimateEventDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ClimateEventDocument> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

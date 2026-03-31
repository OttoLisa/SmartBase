import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { Device } from '../../device/schema/device.schema';
import { Household } from '../../household/schema/household.schema';
import { EventType } from '../enum/event-type.enum';

export type EventDocument = HydratedDocument<DeviceEvent>;

@Schema({
  timeseries: {
    timeField: 'createdAt',
    metaField: 'meta',
    granularity: 'seconds',
  },
  autoCreate: true,
  versionKey: false,
})
export class DeviceEvent {
  @Prop({ required: true })
  createdAt: Date;

  @Prop({
    type: {
      device: { type: Types.ObjectId, ref: Device.name },
      household: { type: Types.ObjectId, ref: Household.name },
    },
    required: true,
  })
  meta: {
    device: Types.ObjectId;
    household: Types.ObjectId;
  };

  @Prop({ required: true })
  type: EventType | string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  details: Record<string, unknown>;
}

export const DeviceEventSchema = SchemaFactory.createForClass(DeviceEvent);

DeviceEventSchema.index({ 'meta.device': 1, createdAt: -1 });
DeviceEventSchema.index({ 'meta.household': 1, createdAt: -1 });
DeviceEventSchema.index({ type: 1, createdAt: -1 });

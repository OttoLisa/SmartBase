import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { Device } from '../../device/schema/device.schema';
import { Household } from '../../household/schema/household.schema';

export type MeasurementDocument = HydratedDocument<Measurement>;

@Schema({
  timeseries: {
    timeField: 'createdAt',
    metaField: 'meta',
    granularity: 'seconds',
  },
  expireAfterSeconds: 3600 * 24 * 30,
  versionKey: false,
})
export class Measurement {
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

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  payload: Record<string, unknown>;
}

export const createMeasurementSchema = () => {
  const schema = SchemaFactory.createForClass(Measurement);
  schema.index({ 'meta.device': 1, createdAt: -1 });
  schema.index({ 'meta.household': 1, createdAt: -1 });
  return schema;
};

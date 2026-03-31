import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Device } from '../../device/schema/device.schema';
import { Household } from '../../household/schema/household.schema';

export type ThresholdDocument = HydratedDocument<Threshold>;

export enum ThresholdDirection {
  MIN = 'MIN',
  MAX = 'MAX',
}

@Schema({ timestamps: true, versionKey: false })
export class Threshold {
  @Prop({ type: Types.ObjectId, ref: Device.name, required: true })
  device: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Household.name, required: true })
  household: Types.ObjectId;

  @Prop({ required: true })
  field: string;

  @Prop({ required: true })
  value: number;

  @Prop({ required: true, enum: ThresholdDirection })
  direction: ThresholdDirection;

  @Prop({ default: true })
  active: boolean;
}

export const ThresholdSchema = SchemaFactory.createForClass(Threshold);

ThresholdSchema.index({ device: 1, field: 1, direction: 1 }, { unique: true });

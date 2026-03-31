import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Household } from '../../household/schema/household.schema';

export type DeviceDocument = Device & {
  _id: Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
};

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  ip: string;

  @Prop({ required: true, unique: true })
  macAddress: string;

  @Prop({ type: Types.ObjectId, ref: Household.name, required: true })
  household: Types.ObjectId;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import * as userSchema from '../../user/schema/user.schema';
import { UserDocument } from '../../user/schema/user.schema';

export type HouseholdDocument = Household & {
  _id: string;
};

export type HouseholdPopulated = {
  _id: Types.ObjectId;
  id: string;
  name: string;
  owner: UserDocument;
  members: UserDocument[];
  viewers: UserDocument[];
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class Household {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: userSchema.User.name, required: true })
  owner: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: userSchema.User.name }],
    default: [],
  })
  members: userSchema.UserDocument[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: userSchema.User.name }],
    default: [],
  })
  viewers: userSchema.UserDocument[];
}

export const HouseholdSchema = SchemaFactory.createForClass(Household);

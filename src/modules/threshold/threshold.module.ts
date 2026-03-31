import { Module } from '@nestjs/common';
import { ThresholdService } from './threshold.service';
import { ThresholdController } from './threshold.controller';
import { Threshold, ThresholdSchema } from './schema/threshold.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Household,
  HouseholdSchema,
} from '../household/schema/household.schema';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Threshold.name, schema: ThresholdSchema },
      { name: Household.name, schema: HouseholdSchema },
    ]),
    UserModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [ThresholdController],
  providers: [ThresholdService],
  exports: [ThresholdService],
})
export class ThresholdModule {}

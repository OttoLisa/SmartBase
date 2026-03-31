import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Measurement,
  createMeasurementSchema,
} from '../measurement/schema/measurement.schema';
import { Device, DeviceSchema } from '../device/schema/device.schema';
import {
  Household,
  HouseholdSchema,
} from '../household/schema/household.schema';
import {
  Threshold,
  ThresholdSchema,
} from '../threshold/schema/threshold.schema';
import { DeviceEvent, DeviceEventSchema } from '../event/schema/event.schema';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Measurement.name,
        inject: [ConfigService],
        useFactory: () => createMeasurementSchema(),
      },
      { name: Device.name, useFactory: () => DeviceSchema },
      { name: Household.name, useFactory: () => HouseholdSchema },
      { name: Threshold.name, useFactory: () => ThresholdSchema },
      { name: DeviceEvent.name, useFactory: () => DeviceEventSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SharedModule {}

import { Module } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { MeasurementController } from './measurement.controller';
import { UserModule } from '../user/user.module';
import { HouseholdModule } from '../household/household.module';
import { JwtModule } from '@nestjs/jwt';
import { EventModule } from '../event/event.module';
import { SharedModule } from '../shared/measurement-shared.module';

@Module({
  controllers: [MeasurementController],
  providers: [MeasurementService],
  exports: [MeasurementService],
  imports: [
    SharedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
    }),
    UserModule,
    HouseholdModule,
    EventModule,
  ],
})
export class MeasurementModule {}

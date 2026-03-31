import { forwardRef, Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { HouseholdModule } from '../household/household.module';
import { SharedModule } from '../shared/measurement-shared.module';

@Module({
  controllers: [DeviceController],
  providers: [DeviceService],
  imports: [
    SharedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
    }),
    UserModule,
    forwardRef(() => HouseholdModule),
  ],
  exports: [DeviceService],
})
export class DeviceModule {}

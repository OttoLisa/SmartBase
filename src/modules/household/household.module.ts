import { forwardRef, Module } from '@nestjs/common';
import { HouseholdService } from './household.service';
import { HouseholdController } from './household.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Household, HouseholdSchema } from './schema/household.schema';
import { UserModule } from '../user/user.module';
import { DeviceModule } from '../device/device.module';

@Module({
  controllers: [HouseholdController],
  providers: [HouseholdService],
  imports: [
    MongooseModule.forFeature([
      { name: Household.name, schema: HouseholdSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
    }),
    UserModule,
    forwardRef(() => DeviceModule),
  ],
  exports: [HouseholdService],
})
export class HouseholdModule {}

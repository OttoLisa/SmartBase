import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import { HouseholdModule } from './modules/household/household.module';
import { DeviceModule } from './modules/device/device.module';
import { MeasurementModule } from './modules/measurement/measurement.module';
import { EventModule } from './modules/event/event.module';
import { ThresholdModule } from './modules/threshold/threshold.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: `mongodb://${cfg.get<string>('MONGO_USER')}:${cfg.get<string>('MONGO_PASS')}@${cfg.get<string>('MONGO_HOST')}:${cfg.get<string>('MONGO_PORT')}/${cfg.get<string>('MONGO_DB')}?authSource=admin`,
      }),
    }),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    RoleModule,
    HouseholdModule,
    DeviceModule,
    MeasurementModule,
    EventModule,
    ThresholdModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

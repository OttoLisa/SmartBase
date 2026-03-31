import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventGateway } from './event.gateway';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtGuard } from '../../guards/ws.guard';
import { DeviceWatcherService } from './device-watcher-service';
import { EventController } from './event.controller';
import { UserModule } from '../user/user.module';
import { SharedModule } from '../shared/measurement-shared.module';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [
    SharedModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
    UserModule,
    DeviceModule,
  ],
  controllers: [EventController],
  providers: [EventService, EventGateway, DeviceWatcherService, WsJwtGuard],
  exports: [EventService],
})
export class EventModule {}

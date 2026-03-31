import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../guards/ws.guard';
import { JwtContentDto } from '../../dto/jwt-content.dto';
import { DeviceService } from '../device/device.service';

@WebSocketGateway({ cors: { origin: '*', credentials: true } })
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventGateway.name);

  constructor(private readonly deviceService: DeviceService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join:household')
  async joinHousehold(
    @MessageBody() householdId: string,
    @ConnectedSocket() client: Socket,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = client.data.user as JwtContentDto;
    try {
      await this.deviceService.isPermittedReadOnly(user.sub, householdId);
    } catch {
      throw new WsException('Forbidden');
    }
    await client.join(`household:${householdId}`);
    this.logger.log(`${client.id} joined household:${householdId}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join:device')
  async joinDevice(
    @MessageBody() deviceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = client.data.user as JwtContentDto;
    try {
      const device = await this.deviceService.findDeviceModel(deviceId);

      console.log(device);

      await this.deviceService.isPermittedReadOnly(
        user.sub,
        device.household._id.toString(),
      );
    } catch {
      throw new WsException('Forbidden');
    }
    await client.join(`device:${deviceId}`);
    this.logger.log(`${client.id} joined device:${deviceId}`);
  }

  broadcastEvent(event: {
    type: string;
    meta: { device: string; household: string };
    details: Record<string, unknown>;
    createdAt: Date;
  }) {
    this.server.to(`household:${event.meta.household}`).emit('event', event);
    this.server.to(`device:${event.meta.device}`).emit('event', event);
  }
}

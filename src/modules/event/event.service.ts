import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventGateway } from './event.gateway';
import { EventType } from './enum/event-type.enum';
import { DeviceEvent, EventDocument } from './schema/event.schema';
import { UserService } from '../user/user.service';
import { Device, DeviceDocument } from '../device/schema/device.schema';
import {
  Household,
  HouseholdDocument,
} from '../household/schema/household.schema';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectModel(DeviceEvent.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(Household.name)
    private readonly householdModel: Model<HouseholdDocument>,
    private readonly userService: UserService,
    private readonly gateway: EventGateway,
  ) {}

  async emit(
    deviceId: Types.ObjectId,
    householdId: Types.ObjectId,
    type: EventType | string,
    details: Record<string, unknown> = {},
  ) {
    const event = await new this.eventModel({
      createdAt: new Date(),
      meta: { device: deviceId, household: householdId },
      type,
      details,
    }).save();

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    this.logger.log(`[${type}] device=${deviceId} household=${householdId}`);

    this.gateway.broadcastEvent({
      type,
      meta: {
        device: deviceId.toString(),
        household: householdId.toString(),
      },
      details,
      createdAt: event.createdAt,
    });

    return event;
  }

  emitThresholdExceeded(
    deviceId: Types.ObjectId,
    householdId: Types.ObjectId,
    field: string,
    value: number,
    threshold: number,
  ) {
    return this.emit(deviceId, householdId, EventType.THRESHOLD_EXCEEDED, {
      field,
      value,
      threshold,
      exceededBy: +(value - threshold).toFixed(2),
    });
  }

  emitDeviceOffline(deviceId: Types.ObjectId, householdId: Types.ObjectId) {
    return this.emit(deviceId, householdId, EventType.DEVICE_OFFLINE, {
      detectedAt: new Date(),
    });
  }

  emitDeviceOnline(deviceId: Types.ObjectId, householdId: Types.ObjectId) {
    return this.emit(deviceId, householdId, EventType.DEVICE_ONLINE, {
      detectedAt: new Date(),
    });
  }

  private async checkPermission(email: string, householdId: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) throw new ForbiddenException();

    const household = await this.householdModel.findById(householdId).exec();
    if (!household) throw new ForbiddenException();

    const userId = new Types.ObjectId(user.id);
    const isOwner = household.owner.equals(userId);
    const isMember = household.members.some((m) => m._id === userId);

    if (!isOwner && !isMember) throw new ForbiddenException();
  }

  async findByDevice(email: string, deviceId: string, from?: Date, to?: Date) {
    const device = await this.deviceModel.findById(deviceId).exec();

    if (!device) throw new NotFoundException();

    await this.checkPermission(email, device.household.toString());

    const query: Record<string, unknown> = {
      'meta.device': new Types.ObjectId(deviceId),
    };
    if (from && to) query.createdAt = { $gte: from, $lte: to };

    return this.eventModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findByHousehold(
    email: string,
    householdId: string,
    from?: Date,
    to?: Date,
  ) {
    await this.checkPermission(email, householdId);

    const query: Record<string, unknown> = {
      'meta.household': new Types.ObjectId(householdId),
    };
    if (from && to) query.createdAt = { $gte: from, $lte: to };

    return this.eventModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findByType(
    email: string,
    householdId: string,
    type: EventType | string,
  ) {
    await this.checkPermission(email, householdId);

    return this.eventModel
      .find({
        'meta.household': new Types.ObjectId(householdId),
        type,
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}

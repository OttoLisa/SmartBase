import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Measurement, MeasurementDocument } from './schema/measurement.schema';
import { Connection, Model, Types } from 'mongoose';
import { Device, DeviceDocument } from '../device/schema/device.schema';
import { UserService } from '../user/user.service';
import { Household } from '../household/schema/household.schema';
import {
  Threshold,
  ThresholdDirection,
} from '../threshold/schema/threshold.schema';
import { EventService } from '../event/event.service';

@Injectable()
export class MeasurementService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Measurement.name)
    private readonly measurementModel: Model<MeasurementDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(Household.name)
    private readonly householdModel: Model<Household>,
    @InjectModel(Threshold.name)
    private readonly thresholdModel: Model<Threshold>,
    private readonly eventService: EventService,
    private readonly userService: UserService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.connection.db!.command({
        collMod: this.measurementModel.collection.collectionName,
        expireAfterSeconds: 3600 * 24 * 30,
      });
    } catch {
      // Collection does not exist yet; will be created with TTL from schema options
    }
  }

  async recordByDevice(
    ip: string | null,
    mac: string | null,
    payload: Record<string, unknown>,
  ) {
    const query = mac ? { macAddress: mac } : { ip: ip };
    const device = await this.deviceModel.findOne(query).exec();
    if (!device) throw new NotFoundException(`Device not found`);

    const measurement = await new this.measurementModel({
      createdAt: new Date(),
      meta: {
        device: device._id,
        household: device.household,
      },
      payload,
    }).save();

    await this.checkThresholds(device._id, device.household, payload);

    return measurement;
  }

  async findByDevice(deviceId: string, email: string) {
    const device = await this.deviceModel.findById(deviceId).exec();
    if (!device) throw new NotFoundException(`Device not found`);

    await this.checkPermissionReadonly(email, device.household.toString());

    return this.measurementModel
      .find({ 'meta.device': new Types.ObjectId(deviceId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByHousehold(householdId: string, email: string) {
    await this.checkPermissionReadonly(email, householdId.toString());

    return this.measurementModel
      .find({ 'meta.household': new Types.ObjectId(householdId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByDeviceInRange(
    deviceId: string,
    email: string,
    from: Date,
    to: Date,
    contains?: string,
  ) {
    const device = await this.deviceModel.findById(deviceId).exec();
    if (!device) throw new NotFoundException(`Device not found`);

    await this.checkPermissionReadonly(email, device.household.toString());

    const query: Record<string, unknown> = {
      'meta.device': new Types.ObjectId(deviceId),
      createdAt: { $gte: from, $lte: to },
    };

    if (contains) {
      query[`payload.${contains}`] = { $exists: true };
    }

    return this.measurementModel.find(query).sort({ createdAt: 1 }).exec();
  }

  async findLatestByDevice(deviceId: string, email: string, contains?: string) {
    const device = await this.deviceModel.findById(deviceId).exec();
    if (!device) throw new NotFoundException(`Device not found`);

    await this.checkPermissionReadonly(email, device.household.toString());

    const query: Record<string, unknown> = {
      'meta.device': new Types.ObjectId(deviceId),
    };

    if (contains) {
      query[`payload.${contains}`] = { $exists: true };
    }

    return this.measurementModel.findOne(query).sort({ createdAt: -1 }).exec();
  }

  private async checkPermissionReadonly(
    email: string,
    householdId: string,
  ): Promise<void> {
    const userId = await this.getUser(email);
    const household = await this.getHousehold(householdId);

    const isOwner = household.owner.equals(userId);
    const isMember = household.members.some(
      (m) => m._id.toString() === userId.toString(),
    );
    const isViewer = household.viewers.some(
      (m) => m._id.toString() === userId.toString(),
    );

    if (!isOwner && !isMember && !isViewer) throw new ForbiddenException();
  }

  async aggregateByDevice(
    email: string,
    deviceId: string,
    from: Date,
    to: Date,
    contains: string,
  ) {
    const device = await this.deviceModel.findById(deviceId).exec();

    if (!device) throw new NotFoundException(`Device not found`);

    await this.checkPermissionReadonly(email, device.household.toString());

    return this.measurementModel.aggregate([
      {
        $match: {
          'meta.device': new Types.ObjectId(deviceId),
          createdAt: { $gte: from, $lte: to },
          [`payload.${contains}`]: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          min: { $min: `$payload.${contains}` },
          max: { $max: `$payload.${contains}` },
          avg: { $avg: `$payload.${contains}` },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          min: 1,
          max: 1,
          avg: { $round: ['$avg', 2] },
          count: 1,
          field: contains,
          from,
          to,
        },
      },
    ]);
  }

  async aggregateByHousehold(
    email: string,
    householdId: string,
    from: Date,
    to: Date,
    contains: string,
  ) {
    await this.checkPermissionReadonly(email, householdId);

    return this.measurementModel.aggregate([
      {
        $match: {
          'meta.household': new Types.ObjectId(householdId),
          createdAt: { $gte: from, $lte: to },
          [`payload.${contains}`]: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$meta.device',
          min: { $min: `$payload.${contains}` },
          max: { $max: `$payload.${contains}` },
          avg: { $avg: `$payload.${contains}` },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          device: '$_id',
          min: 1,
          max: 1,
          avg: { $round: ['$avg', 2] },
          count: 1,
          field: contains,
          from,
          to,
        },
      },
    ]);
  }

  private async getUser(email: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) throw new NotFoundException(`User not found`);
    return user._id;
  }

  private async getHousehold(householdId: string) {
    const household = await this.householdModel
      .findById(new Types.ObjectId(householdId))
      .exec();
    if (!household) throw new ForbiddenException();
    return household;
  }

  private async checkThresholds(
    deviceId: Types.ObjectId,
    householdId: Types.ObjectId,
    payload: Record<string, unknown>,
  ) {
    const thresholds = await this.thresholdModel
      .find({
        device: deviceId,
        active: true,
      })
      .exec();

    for (const threshold of thresholds) {
      const value = payload[threshold.field];
      if (typeof value !== 'number') continue;

      const exceeded =
        threshold.direction === ThresholdDirection.MAX
          ? value > threshold.value
          : value < threshold.value;

      if (exceeded) {
        await this.eventService.emitThresholdExceeded(
          deviceId,
          householdId,
          threshold.field,
          value,
          threshold.value,
        );
      }
    }
  }
}

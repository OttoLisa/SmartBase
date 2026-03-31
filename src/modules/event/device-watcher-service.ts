import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { EventService } from './event.service';
import { Device, DeviceDocument } from '../device/schema/device.schema';
import {
  Measurement,
  MeasurementDocument,
} from '../measurement/schema/measurement.schema';

const OFFLINE_THRESHOLD_MINUTES = 5;

@Injectable()
export class DeviceWatcherService {
  private readonly logger = new Logger(DeviceWatcherService.name);
  private readonly deviceStatus = new Map<string, 'online' | 'offline'>();

  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(Measurement.name)
    private readonly measurementModel: Model<MeasurementDocument>,
    private readonly eventService: EventService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkDevices() {
    const devices = await this.deviceModel.find().exec();
    const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MINUTES * 60 * 1000);

    for (const device of devices) {
      const latest = await this.measurementModel
        .findOne({ 'meta.device': device._id })
        .sort({ createdAt: -1 })
        .exec();

      const id = device._id.toString();
      const wasOffline = this.deviceStatus.get(id) === 'offline';

      if (!latest || latest.createdAt < cutoff) {
        if (!wasOffline) {
          this.logger.warn(`Device offline: ${id}`);
          this.deviceStatus.set(id, 'offline');
          await this.eventService.emitDeviceOffline(
            device._id,
            device.household,
          );
        }
      } else {
        if (wasOffline) {
          this.logger.log(`Device back online: ${id}`);
          this.deviceStatus.set(id, 'online');
          await this.eventService.emitDeviceOnline(
            device._id,
            device.household,
          );
        } else {
          this.deviceStatus.set(id, 'online');
        }
      }
    }
  }
}

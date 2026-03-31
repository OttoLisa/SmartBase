import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceDocument } from './schema/device.schema';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { HouseholdService } from '../household/household.service';
import { DeviceState } from './enum/device.state';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Measurement } from '../measurement/schema/measurement.schema';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel('Device') private readonly deviceModel: Model<Device>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => HouseholdService))
    private readonly householdService: HouseholdService,
    @InjectModel(Measurement.name)
    private readonly measurementModel: Model<Measurement>,
  ) {}

  async createDevice(
    createDeviceDto: CreateDeviceDto,
    email: string,
  ): Promise<DeviceDocument | null> {
    const household = await this.isPermitted(email, createDeviceDto.household);

    const device = new this.deviceModel({
      name: createDeviceDto.name,
      household: household,
      type: createDeviceDto.type,
      location: createDeviceDto.location,
      ip: createDeviceDto.ip,
      macAddress: createDeviceDto.macAddress,
    });

    const saved = await device.save();
    return this.deviceModel
      .findById<DeviceDocument>(saved._id)
      .populate('household')
      .exec();
  }

  async findDevice(id: string, email: string) {
    const device = (await this.findDeviceModel(id)) as Device as DeviceDocument;
    await this.isPermittedReadOnly(email, device.household._id.toString());

    return device;
  }

  async findDevicesByHousehold(householdId: string, userEmail: string) {
    const household = await this.isPermittedReadOnly(userEmail, householdId);

    return this.deviceModel
      .find<DeviceDocument>({ household: household._id })
      .populate('household')
      .exec();
  }

  async getDeviceState(id: string, email: string) {
    const device = await this.findDevice(id, email);

    if (!device) {
      throw new NotFoundException(`Device with id ${id} not found`);
    }

    const latestMeasurement = await this.measurementModel
      .findOne({ 'meta.device': device._id })
      .sort({ createdAt: -1 })
      .exec();

    if (!latestMeasurement) {
      return DeviceState.OFFLINE;
    }

    return latestMeasurement.createdAt >= new Date(Date.now() - 5 * 60 * 1000)
      ? DeviceState.ONLINE
      : DeviceState.OFFLINE;
  }

  async updateDevice(
    id: string,
    updateData: UpdateDeviceDto,
    email: string,
  ): Promise<DeviceDocument | null> {
    const device = await this.findDeviceModel(id);
    await this.isPermitted(email, device.household._id.toString());

    if (updateData.name !== undefined) {
      device.name = updateData.name;
    }
    if (updateData.type !== undefined) {
      device.type = updateData.type;
    }
    if (updateData.location !== undefined) {
      device.location = updateData.location;
    }
    if (updateData.ip !== undefined) {
      device.ip = updateData.ip;
    }

    if (updateData.macAddress !== undefined) {
      device.macAddress = updateData.macAddress;
    }

    const saved = await device.save();
    return this.deviceModel
      .findById<DeviceDocument>(saved._id)
      .populate('household')
      .exec();
  }

  async deleteDevice(id: string, email: string) {
    const device = await this.findDevice(id, email);
    await this.isPermitted(email, device.household._id.toString());

    const result = await this.deviceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new Error(`Device with id ${id} not found`);
    }
  }

  private async isPermitted(userEmail: string, householdId: string) {
    const user = await this.userService.findOneByEmail(userEmail);
    if (!user) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    const household = await this.householdService.findHousehold(householdId);
    if (!household) {
      throw new NotFoundException(`Household with id ${householdId} not found`);
    }

    if (
      household.owner._id.toString() !== user._id.toString() &&
      !household.members.some(
        (member) => member._id.toString() === user._id.toString(),
      )
    ) {
      throw new UnauthorizedException(
        `Household with id ${householdId} not found`,
      );
    }

    return household;
  }

  async isPermittedReadOnly(userEmail: string, householdId: string) {
    const user = await this.userService.findOneByEmail(userEmail);
    if (!user) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    const household = await this.householdService.findHousehold(householdId);
    if (!household) {
      throw new NotFoundException(`Household with id ${householdId} not found`);
    }

    if (
      household.owner._id.toString() !== user._id.toString() &&
      !household.members.some(
        (member) => member._id.toString() === user._id.toString(),
      ) &&
      !household.viewers.some(
        (viewer) => viewer._id.toString() === user._id.toString(),
      )
    ) {
      throw new UnauthorizedException(
        `Household with id ${householdId} not found`,
      );
    }

    return household;
  }

  async findDeviceModel(id: string) {
    const device = await this.deviceModel
      .findById(id)
      .populate('household')
      .exec();
    if (!device) {
      throw new NotFoundException(`Device with id ${id} not found`);
    }

    return device;
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Household,
  HouseholdDocument,
} from '../household/schema/household.schema';
import {
  Threshold,
  ThresholdDirection,
  ThresholdDocument,
} from './schema/threshold.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class ThresholdService {
  constructor(
    @InjectModel(Threshold.name)
    private readonly thresholdModel: Model<ThresholdDocument>,
    @InjectModel(Household.name)
    private readonly householdModel: Model<HouseholdDocument>,
    private readonly userService: UserService,
  ) {}

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

  async create(
    email: string,
    deviceId: string,
    householdId: string,
    field: string,
    value: number,
    direction: ThresholdDirection,
  ): Promise<ThresholdDocument> {
    await this.checkPermission(email, householdId);

    return new this.thresholdModel({
      device: new Types.ObjectId(deviceId),
      household: new Types.ObjectId(householdId),
      field,
      value,
      direction,
    }).save();
  }

  async update(
    email: string,
    thresholdId: string,
    value: number,
  ): Promise<ThresholdDocument> {
    const threshold = await this.thresholdModel.findById(thresholdId).exec();
    if (!threshold)
      throw new NotFoundException(`Threshold ${thresholdId} not found`);

    await this.checkPermission(email, threshold.household.toString());

    threshold.value = value;
    return threshold.save();
  }

  async toggleActive(
    email: string,
    thresholdId: string,
  ): Promise<ThresholdDocument> {
    const threshold = await this.thresholdModel.findById(thresholdId).exec();
    if (!threshold)
      throw new NotFoundException(`Threshold ${thresholdId} not found`);

    await this.checkPermission(email, threshold.household.toString());

    threshold.active = !threshold.active;
    return threshold.save();
  }

  async remove(email: string, thresholdId: string): Promise<void> {
    const threshold = await this.thresholdModel.findById(thresholdId).exec();
    if (!threshold)
      throw new NotFoundException(`Threshold ${thresholdId} not found`);

    await this.checkPermission(email, threshold.household.toString());

    await this.thresholdModel.findByIdAndDelete(thresholdId).exec();
  }

  findByDevice(deviceId: string): Promise<ThresholdDocument[]> {
    return this.thresholdModel
      .find({ device: new Types.ObjectId(deviceId), active: true })
      .exec();
  }

  checkPayload(
    thresholds: ThresholdDocument[],
    payload: Record<string, unknown>,
  ): { exceeded: ThresholdDocument; value: number }[] {
    const results: { exceeded: ThresholdDocument; value: number }[] = [];

    for (const threshold of thresholds) {
      const value = payload[threshold.field];
      if (typeof value !== 'number') continue;

      const exceeded =
        threshold.direction === ThresholdDirection.MAX
          ? value > threshold.value
          : value < threshold.value;

      if (exceeded) results.push({ exceeded: threshold, value });
    }

    return results;
  }
}

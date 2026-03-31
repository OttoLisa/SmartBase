import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Household,
  HouseholdDocument,
  HouseholdPopulated,
} from './schema/household.schema';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { DeviceService } from '../device/device.service';

@Injectable()
export class HouseholdService {
  constructor(
    @InjectModel(Household.name)
    private householdModel: Model<HouseholdDocument>,
    private userService: UserService,
    @Inject(forwardRef(() => DeviceService))
    private deviceService: DeviceService,
  ) {}

  async createHousehold(createHouseholdDto: CreateHouseholdDto, email: string) {
    const owner = await this.userService.findOneByEmail(email);

    if (!owner) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const members = createHouseholdDto.members?.map((member) => {
      return this.userService.findOneByEmail(member);
    });

    const household = new this.householdModel({
      name: createHouseholdDto.name,
      owner: owner,
    });

    if (members) {
      const resolvedMembers = await Promise.all(members);
      household.members = resolvedMembers.filter((member) => member !== null);
    }

    const saved = await household.save();

    return this.householdModel
      .findOne<HouseholdPopulated>({ _id: saved._id })
      .populate('owner')
      .populate('members')
      .exec();
  }

  async findHousehold(id: string) {
    return this.householdModel
      .findById(id)
      .populate('owner')
      .populate('members')
      .exec();
  }

  async findHouseholdPopulated(id: string) {
    return this.householdModel
      .findById<HouseholdPopulated>(id)
      .populate('owner')
      .populate('members')
      .populate('viewers')
      .exec();
  }

  async findHouseholdForPermitted(email: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return this.householdModel
      .find<HouseholdPopulated>({
        $or: [
          { owner: user._id },
          { members: { _id: user._id } },
          { viewers: { _id: user._id } },
        ],
      })
      .populate('owner')
      .populate('members')
      .populate('viewers')
      .exec();
  }

  async findHouseholdPermitted(id: string, email: string) {
    const household = await this.findHouseholdPopulated(id);
    if (!household) {
      throw new NotFoundException(`Household with id ${id} not found`);
    }

    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
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
      throw new ForbiddenException(`You are not a member of this household`);
    }

    return household;
  }

  async updateHousehold(
    id: string,
    email: string,
    updateHouseholdDto: UpdateHouseholdDto,
  ) {
    const household = await this.findHousehold(id);

    if (!household) {
      throw new NotFoundException(`Household with id ${id} not found`);
    }

    const owner = await this.userService.findOneByEmail(email);

    if (!owner) {
      throw new UnauthorizedException(`User with email ${email} not found`);
    }

    if (owner._id !== household.owner) {
      throw new ForbiddenException(`You are not the owner of this household`);
    }

    if (updateHouseholdDto.name) {
      household.name = updateHouseholdDto.name;
    }

    if (updateHouseholdDto.owner) {
      const owner = await this.userService.findOneByEmail(
        updateHouseholdDto.owner,
      );

      if (!owner) {
        throw new NotFoundException(`Household with id ${id} not found`);
      }

      household.owner = owner._id;
    }

    const saved = await household.save();
    return this.householdModel
      .findOne<HouseholdPopulated>({ _id: saved._id })
      .populate('owner')
      .populate('members')
      .exec();
  }

  async deleteHousehold(id: string, email: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new ForbiddenException(`User with email ${email} not found`);
    }

    const household = await this.findHousehold(id);
    if (!household) {
      throw new NotFoundException(`Household with id ${id} not found`);
    }

    if (household.owner._id.toString() !== user._id.toString()) {
      throw new ForbiddenException(`You are not the owner of this household`);
    }

    return this.householdModel.findByIdAndDelete(id).exec();
  }

  async addMember(id: string, ownerEmail: string, targetEmail: string) {
    const { household } = await this.findHouseholdWithOwnerCheck(
      id,
      ownerEmail,
    );

    const target = await this.userService.findOneByEmail(targetEmail);
    if (!target) {
      throw new NotFoundException(`User with email ${targetEmail} not found`);
    }

    const targetId = target._id.toString();
    const isViewer = household.viewers.some(
      (v) => v._id.toString() === targetId,
    );
    const isMember = household.members.some(
      (m) => m._id.toString() === targetId,
    );

    if (isViewer) {
      household.viewers = household.viewers.filter(
        (v) => v._id.toString() !== targetId,
      );
    }

    if (!isMember) {
      household.members.push(target);
    }

    await household.save();
    return this.populatedHousehold(id);
  }

  async removeMember(id: string, ownerEmail: string, targetEmail: string) {
    const { household } = await this.findHouseholdWithOwnerCheck(
      id,
      ownerEmail,
    );

    const target = await this.userService.findOneByEmail(targetEmail);
    if (!target) {
      throw new NotFoundException(`User with email ${targetEmail} not found`);
    }

    household.members = household.members.filter(
      (m) => m._id.toString() !== target._id.toString(),
    );

    await household.save();
    return this.populatedHousehold(id);
  }

  async addViewer(id: string, ownerEmail: string, targetEmail: string) {
    const { household } = await this.findHouseholdWithOwnerCheck(
      id,
      ownerEmail,
    );

    const target = await this.userService.findOneByEmail(targetEmail);
    if (!target) {
      throw new NotFoundException(`User with email ${targetEmail} not found`);
    }

    const targetId = target._id.toString();
    const isMember = household.members.some(
      (m) => m._id.toString() === targetId,
    );
    const isViewer = household.viewers.some(
      (v) => v._id.toString() === targetId,
    );

    if (isMember) {
      household.members = household.members.filter(
        (m) => m._id.toString() !== targetId,
      );
    }

    if (!isViewer) {
      household.viewers.push(target);
    }

    await household.save();
    return this.populatedHousehold(id);
  }

  async removeViewer(id: string, ownerEmail: string, targetEmail: string) {
    const { household } = await this.findHouseholdWithOwnerCheck(
      id,
      ownerEmail,
    );

    const target = await this.userService.findOneByEmail(targetEmail);
    if (!target) {
      throw new NotFoundException(`User with email ${targetEmail} not found`);
    }

    household.viewers = household.viewers.filter(
      (v) => v._id.toString() !== target._id.toString(),
    );

    await household.save();
    return this.populatedHousehold(id);
  }

  async getDevicesForHousehold(id: string, email: string) {
    const household = await this.findHousehold(id);
    if (!household) {
      throw new NotFoundException(`Household with id ${id} not found`);
    }

    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new ForbiddenException(`User with email ${email} not found`);
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
      throw new ForbiddenException(`You are not a member of this household`);
    }

    return this.deviceService.findDevicesByHousehold(id, email);
  }

  private async findHouseholdWithOwnerCheck(id: string, ownerEmail: string) {
    const household = await this.householdModel.findById(id).exec();
    if (!household) {
      throw new NotFoundException(`Household with id ${id} not found`);
    }

    const owner = await this.userService.findOneByEmail(ownerEmail);
    if (!owner) {
      throw new NotFoundException(`User with email ${ownerEmail} not found`);
    }

    if (household.owner.toString() !== owner._id.toString()) {
      throw new ForbiddenException(`You are not the owner of this household`);
    }

    return { household, owner };
  }

  private async populatedHousehold(id: string) {
    const household = await this.householdModel
      .findById<HouseholdPopulated>(id)
      .populate('owner')
      .populate('members')
      .populate('viewers')
      .exec();

    if (!household) {
      throw new NotFoundException(`Household with id ${id} not found`);
    }

    return household;
  }
}

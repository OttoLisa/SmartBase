import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../role/schema/role.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
  ) {}

  findAll() {
    return this.userModel.find().populate('roles').exec();
  }

  findOne(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).populate('roles').exec();
  }

  findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).populate('roles').exec();
  }

  async create(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(createUserDto.password, salt);

    const createdUser = new this.userModel({
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      password: hash,
    });
    return createdUser.save();
  }

  update(sub: string, updateUserDto: UpdateUserDto) {
    return this.userModel
      .findOneAndUpdate({ email: sub }, updateUserDto, { new: true })
      .exec();
  }

  remove(sub: string) {
    return this.userModel.findOneAndDelete({ email: sub }).exec();
  }

  async addRole(userId: string, roleId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const roleObject = await this.roleModel.findById(roleId).exec();

    if (!roleObject) throw new NotFoundException(`Role ${roleId} not found`);

    if (
      user.roles.some((r) => r._id.toString() === roleObject._id.toString())
    ) {
      throw new BadRequestException('Role already assigned');
    }

    user.roles.push(roleObject);
    await user.save();

    return user.populate('roles');
  }

  async removeRole(userId: string, roleId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const roleObjectId = new Types.ObjectId(roleId);
    user.roles = user.roles.filter((r) => r._id !== roleObjectId._id);
    await user.save();

    return user.populate('roles');
  }
}

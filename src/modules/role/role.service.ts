import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schema/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  findAll() {
    return this.roleModel.find().exec();
  }

  async findOne(id: string) {
    const role = await this.roleModel.findById(id).exec();
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  create(data: CreateRoleDto) {
    data.name = data.name.toUpperCase();
    return new this.roleModel(data).save();
  }

  async remove(id: string) {
    const result = await this.roleModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Role ${id} not found`);
  }
}

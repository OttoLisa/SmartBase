import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiCookieAuth } from '@nestjs/swagger';
import { RoleGuard } from '../../guards/role.guard';
import { AuthGuard } from '../../guards/auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtContentDto } from '../../dto/jwt-content.dto';

@Controller({ version: '1', path: 'user' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async findAll() {
    const users = await this.userService.findAll();
    return users.map((user) => new GetUserDto(user));
  }

  @Get(':id')
  @ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return new GetUserDto(user);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return new GetUserDto(user);
  }

  @Patch(':id')
  @ApiCookieAuth()
  async update(
    @CurrentUser() auth: JwtContentDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.update(auth.sub, updateUserDto);
    return new GetUserDto(user);
  }

  @Delete()
  @ApiCookieAuth()
  async remove(@CurrentUser() auth: JwtContentDto) {
    const user = await this.userService.remove(auth.sub);
    return new GetUserDto(user);
  }

  @Post(':userId/roles/:roleId')
  /*@ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')*/
  async addRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    const user = await this.userService.addRole(userId, roleId);
    return new GetUserDto(user);
  }

  @Delete(':userId/roles/:roleId')
  @ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    const user = await this.userService.removeRole(userId, roleId);
    return new GetUserDto(user);
  }
}

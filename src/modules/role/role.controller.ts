import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleGuard } from '../../guards/role.guard';
import { AuthGuard } from '../../guards/auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ApiCookieAuth } from '@nestjs/swagger';

@Controller({ path: 'role', version: '1' })
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  /*@ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')*/
  @Post()
  create(@Body() body: CreateRoleDto) {
    return this.roleService.create(body);
  }

  @ApiCookieAuth()
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { GetDeviceDto } from './dto/get-device.dto';
import { JwtContentDto } from '../../dto/jwt-content.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller({ path: 'device', version: '1' })
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @ApiCookieAuth()
  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async createDevice(
    @CurrentUser() user: JwtContentDto,
    @Body() createDeviceDto: CreateDeviceDto,
  ) {
    const device = await this.deviceService.createDevice(
      createDeviceDto,
      user.sub,
    );
    return new GetDeviceDto(device);
  }

  @ApiCookieAuth()
  @Get('/:id/state')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async findState(@Param('id') id: string, @CurrentUser() user: JwtContentDto) {
    const deviceState = await this.deviceService.getDeviceState(id, user.sub);
    return {
      state: deviceState,
    };
  }

  @ApiCookieAuth()
  @Get('/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtContentDto) {
    const device = await this.deviceService.findDevice(id, user.sub);
    return new GetDeviceDto(device);
  }

  @ApiCookieAuth()
  @Put('/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtContentDto,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    const device = await this.deviceService.updateDevice(
      id,
      updateDeviceDto,
      user.sub,
    );
    return new GetDeviceDto(device);
  }

  @ApiCookieAuth()
  @Delete('/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async delete(@Param('id') id: string, @CurrentUser() user: JwtContentDto) {
    await this.deviceService.deleteDevice(id, user.sub);
  }
}

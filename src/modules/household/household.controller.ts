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
import { HouseholdService } from './household.service';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtContentDto } from '../../dto/jwt-content.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { MemberActionDto } from './dto/member-action.dto';
import { ApiCookieAuth } from '@nestjs/swagger';
import { GetHouseholdDto } from './dto/get-household.dto';
import { GetDeviceDto } from '../device/dto/get-device.dto';

@Controller({ path: 'household', version: '1' })
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @ApiCookieAuth()
  @Get('me')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async getHousehold(@CurrentUser() user: JwtContentDto) {
    const households = await this.householdService.findHouseholdForPermitted(
      user.sub,
    );

    return households.map((household) => new GetHouseholdDto(household));
  }

  @ApiCookieAuth()
  @Get(':id/devices')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async getHouseholdDevices(
    @CurrentUser() user: JwtContentDto,
    @Param('id') id: string,
  ) {
    const devices = await this.householdService.getDevicesForHousehold(
      id,
      user.sub,
    );

    return devices.map((device) => new GetDeviceDto(device));
  }

  @ApiCookieAuth()
  @Get(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async findHousehold(
    @CurrentUser() user: JwtContentDto,
    @Param('id') id: string,
  ) {
    const household = await this.householdService.findHouseholdPermitted(
      id,
      user.sub,
    );

    return new GetHouseholdDto(household);
  }

  @ApiCookieAuth()
  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async createHousehold(
    @Body() createHouseholdDto: CreateHouseholdDto,
    @CurrentUser() user: JwtContentDto,
  ) {
    const household = await this.householdService.createHousehold(
      createHouseholdDto,
      user.sub,
    );

    return new GetHouseholdDto(household);
  }

  @ApiCookieAuth()
  @Put(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async updateHousehold(
    @CurrentUser() user: JwtContentDto,
    @Body() updateHouseholdDto: CreateHouseholdDto,
    @Param('id') id: string,
  ) {
    const household = await this.householdService.updateHousehold(
      id,
      user.sub,
      updateHouseholdDto,
    );

    return new GetHouseholdDto(household);
  }

  @ApiCookieAuth()
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async deleteHousehold(
    @CurrentUser() user: JwtContentDto,
    @Param('id') id: string,
  ) {
    await this.householdService.deleteHousehold(id, user.sub);
  }

  @ApiCookieAuth()
  @Post(':id/members')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async addMember(
    @CurrentUser() user: JwtContentDto,
    @Param('id') id: string,
    @Body() body: MemberActionDto,
  ) {
    const household = await this.householdService.addMember(
      id,
      user.sub,
      body.email,
    );
    return new GetHouseholdDto(household);
  }

  @ApiCookieAuth()
  @Delete(':id/members/:email')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async removeMember(
    @CurrentUser() user: JwtContentDto,
    @Param('id') id: string,
    @Param('email') email: string,
  ) {
    const household = await this.householdService.removeMember(
      id,
      user.sub,
      email,
    );
    return new GetHouseholdDto(household);
  }

  @ApiCookieAuth()
  @Post(':id/viewers')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async addViewer(
    @CurrentUser() user: JwtContentDto,
    @Param('id') id: string,
    @Body() body: MemberActionDto,
  ) {
    const household = await this.householdService.addViewer(
      id,
      user.sub,
      body.email,
    );
    return new GetHouseholdDto(household);
  }

  @ApiCookieAuth()
  @Delete(':id/viewers/:email')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  async removeViewer(
    @CurrentUser() user: JwtContentDto,
    @Param('id') id: string,
    @Param('email') email: string,
  ) {
    const household = await this.householdService.removeViewer(
      id,
      user.sub,
      email,
    );
    return new GetHouseholdDto(household);
  }
}

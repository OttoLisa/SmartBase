import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ThresholdService } from './threshold.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtContentDto } from '../../dto/jwt-content.dto';
import { CreateThresholdDTO } from './dto/create-threshold.dto';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import { ApiCookieAuth } from '@nestjs/swagger';

@Controller({ path: 'threshold', version: '1' })
@UseGuards(AuthGuard, RoleGuard)
@ApiCookieAuth()
export class ThresholdController {
  constructor(private readonly thresholdService: ThresholdService) {}

  @Post()
  @Roles('USER')
  create(
    @Body()
    body: CreateThresholdDTO,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.thresholdService.create(
      user.sub,
      body.deviceId,
      body.householdId,
      body.field,
      body.value,
      body.direction,
    );
  }

  @Get('device/:deviceId')
  @Roles('USER')
  findByDevice(@Param('deviceId') deviceId: string) {
    return this.thresholdService.findByDevice(deviceId);
  }

  @Patch(':id')
  @Roles('USER')
  update(
    @Param('id') id: string,
    @Body() body: UpdateThresholdDto,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.thresholdService.update(user.sub, id, body.value);
  }

  @Patch(':id/toggle')
  @Roles('USER')
  toggle(@Param('id') id: string, @CurrentUser() user: JwtContentDto) {
    return this.thresholdService.toggleActive(user.sub, id);
  }

  @Delete(':id')
  @Roles('USER')
  remove(@Param('id') id: string, @CurrentUser() user: JwtContentDto) {
    return this.thresholdService.remove(user.sub, id);
  }
}

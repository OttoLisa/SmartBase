// event.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import { JwtContentDto } from '../../dto/jwt-content.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { ApiCookieAuth } from '@nestjs/swagger';

@Controller({ path: 'event', version: '1' })
@ApiCookieAuth()
@UseGuards(AuthGuard, RoleGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get('device/:deviceId')
  @Roles('USER')
  findByDevice(
    @Param('deviceId') deviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.eventService.findByDevice(
      user.sub,
      deviceId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('household/:householdId')
  @Roles('USER')
  findByHousehold(
    @Param('householdId') householdId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.eventService.findByHousehold(
      user.sub,
      householdId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('household/:householdId/type/:type')
  @Roles('USER')
  findByType(
    @Param('householdId') householdId: string,
    @Param('type') type: string,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.eventService.findByType(user.sub, householdId, type);
  }
}

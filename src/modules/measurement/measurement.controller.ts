import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { Roles } from '../../decorators/roles.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';
import { ApiCookieAuth, ApiHeader } from '@nestjs/swagger';
import express from 'express';
import { CreateMeasurementDto } from './dto/create-measurement.dto';

import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtContentDto } from '../../dto/jwt-content.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller({ path: 'measurement', version: '1' })
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  @Post()
  @ApiHeader({ name: 'x-forwarded-for', required: false })
  record(@Body() body: CreateMeasurementDto, @Req() req: express.Request) {
    return this.measurementService.recordByDevice(
      (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress,
      req.headers['x-device-mac'] as string,
      body.payload,
    );
  }

  @Get('device/:deviceId')
  @ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  findByDevice(
    @Param('deviceId') deviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('contains') contains: string,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.measurementService.findByDeviceInRange(
      deviceId,
      user.sub,
      new Date(from),
      new Date(to),
      contains,
    );
  }

  @Get('device/:deviceId/all')
  @ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  findAllByDevice(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.measurementService.findByDevice(deviceId, user.sub);
  }

  @Get('device/:deviceId/latest')
  @ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  findLatest(
    @Param('deviceId') deviceId: string,
    @Query('contains') contains: string,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.measurementService.findLatestByDevice(
      deviceId,
      user.sub,
      contains,
    );
  }

  @Get('household/:householdId')
  @ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  findByHousehold(
    @Param('householdId') householdId: string,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.measurementService.findByHousehold(householdId, user.sub);
  }

  @Get('device/:deviceId/aggregate')
  @ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  aggregateByDevice(
    @Param('deviceId') deviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('contains') contains: string,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.measurementService.aggregateByDevice(
      user.sub,
      deviceId,
      new Date(from),
      new Date(to),
      contains,
    );
  }

  @Get('household/:householdId/aggregate')
  @ApiCookieAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('USER')
  aggregateByHousehold(
    @Param('householdId') householdId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('contains') contains: string,
    @CurrentUser() user: JwtContentDto,
  ) {
    return this.measurementService.aggregateByHousehold(
      user.sub,
      householdId,
      new Date(from),
      new Date(to),
      contains,
    );
  }

  @MessagePattern('measurements/record')
  recordMqtt(
    @Payload() data: { mac: string; payload: Record<string, unknown> },
  ) {
    return this.measurementService.recordByDevice(null, data.mac, data.payload);
  }
}

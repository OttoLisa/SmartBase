import { Body, Controller, Put, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import express from 'express';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Put()
  async login(
    @Body() body: LoginDto,
    @Response({ passthrough: true }) response: express.Response,
  ) {
    return this.authService.login(body, response);
  }
}

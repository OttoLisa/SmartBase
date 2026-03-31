import { ForbiddenException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

import express from 'express';
import { UserDocument } from '../user/schema/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(login: LoginDto, response: express.Response) {
    const user = await this.userService.findOneByEmail(login.email);

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (!(await bcrypt.compare(login.password, user.password))) {
      throw new ForbiddenException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);

    response.cookie('token', tokens.token, {
      httpOnly: true,
      secure: process.env.BUILD_TPYE !== 'development',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    return tokens;
  }

  generateTokens(user: UserDocument) {
    const payload = {
      sub: user.email,
      displayName: user.firstName + ' ' + user.lastName,
      roles: user.roles.map((role) => role.name),
    };

    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    return {
      token: token,
    };
  }
}

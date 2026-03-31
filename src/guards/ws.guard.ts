import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import process from 'node:process';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = context.switchToWs().getClient();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const token =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.handshake.auth?.token ??
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.handshake.headers?.authorization ??
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      client.handshake.headers?.cookie
        ?.split(';')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .find((c: string) => c.trim().startsWith('token='))
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ?.split('=')[1];

    if (!token) throw new WsException('Unauthorized');

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
      client.data.user = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      return true;
    } catch {
      throw new WsException('Unauthorized');
    }
  }
}

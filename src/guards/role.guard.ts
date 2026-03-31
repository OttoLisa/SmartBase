import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtContentDto } from '../dto/jwt-content.dto';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) return true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const user: JwtContentDto = request.user;

    if (!user) {
      throw new UnauthorizedException('You are not authorized');
    }

    const hasRole = roles.some((role) =>
      user.roles.includes(role.toUpperCase()),
    );

    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to access');
    }

    return true;
  }
}

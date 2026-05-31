import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../guards/permission.guard';
import {
  extractPermissionNames,
  extractRoleNames,
  userRolesWithPermissionsInclude,
} from '../utils/user-authorization.util';

export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { userId: payload.sub },
      include: userRolesWithPermissionsInclude,
    });

    if (!user || user.isBlocked === true) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      userId: user.userId,
      fullname: user.fullname,
      email: user.email,
      isBlocked: user.isBlocked,
      roles: extractRoleNames(user),
      permissions: extractPermissionNames(user),
    };
  }
}

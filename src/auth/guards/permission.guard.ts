import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSION_METADATA_KEY } from '../decorators/permission.decorator';
import { PermissionType } from '../constants/permissions.constant';

const SUPER_ADMIN_ROLE_NAME = 'SUPER_ADMIN';

export interface AuthenticatedUser {
  userId: string;
  fullname?: string;
  email?: string | null;
  isBlocked?: boolean | null;
  roles: string[];
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Read the single required atomic permission string from metadata
    const requiredPermission = this.reflector.getAllAndOverride<PermissionType | undefined>(
      PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission is explicitly bound to the endpoint, let the request pass through
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { userId, roles, permissions } = request.user ?? {};

    if (!userId || !roles || !permissions) {
      throw new UnauthorizedException('Authentication required');
    }

    if (roles.includes(SUPER_ADMIN_ROLE_NAME)) {
      return true;
    }

    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }
}
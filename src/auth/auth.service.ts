import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import {
  extractPermissionNames,
  extractRoleNames,
  userRolesWithPermissionsInclude,
} from './utils/user-authorization.util';

const ACCESS_TOKEN_EXPIRES_IN = '15m' as const;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginUserPayload {
  userId: string;
  fullname: string;
  email: string | null;
  isBlocked: boolean | null;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse extends TokenPair {
  user: LoginUserPayload;
}

interface SessionState {
  sessionId: string;
  refreshToken: string;
  expiresAt: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ userId: loginDto.identity }, { email: loginDto.identity }],
      },
      include: userRolesWithPermissionsInclude,
    });

    const passwordMatches =
      user !== null &&
      (await bcrypt.compare(loginDto.password, user.password));

    if (!user || !passwordMatches || user.isBlocked === true) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.userId);

    return {
      ...tokens,
      user: {
        userId: user.userId,
        fullname: user.fullname,
        email: user.email,
        isBlocked: user.isBlocked,
        roles: extractRoleNames(user),
        permissions: extractPermissionNames(user),
      },
    };
  }

  async generateTokens(userId: string): Promise<TokenPair> {
    const sessionId = randomUUID();
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
    );

    const sessionState: SessionState = {
      sessionId,
      refreshToken: this.hashRefreshToken(refreshToken),
      expiresAt: expiresAt.toISOString(),
    };

    await this.prisma.user.update({
      where: { userId },
      data: { sessionState: sessionState as unknown as Prisma.InputJsonValue },
    });

    return { accessToken, refreshToken };
  }

  async refreshSession(
    userId: string,
    incomingRefreshToken: string,
  ): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { sessionState: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const sessionState = this.parseSessionState(user.sessionState);

    if (
      !sessionState ||
      !this.isRefreshTokenValid(incomingRefreshToken, sessionState.refreshToken) ||
      this.isSessionExpired(sessionState.expiresAt)
    ) {
      await this.clearUserSession(userId);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.generateTokens(userId);
  }

  private parseSessionState(value: Prisma.JsonValue | null): SessionState | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const record = value as Record<string, unknown>;
    const { sessionId, refreshToken, expiresAt } = record;

    if (
      typeof sessionId !== 'string' ||
      typeof refreshToken !== 'string' ||
      typeof expiresAt !== 'string'
    ) {
      return null;
    }

    return { sessionId, refreshToken, expiresAt };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isRefreshTokenValid(plainToken: string, storedHash: string): boolean {
    const incomingHash = this.hashRefreshToken(plainToken);
    const incomingBuffer = Buffer.from(incomingHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (incomingBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(incomingBuffer, storedBuffer);
  }

  private isSessionExpired(expiresAt: string): boolean {
    const expiration = new Date(expiresAt);
    return Number.isNaN(expiration.getTime()) || expiration.getTime() <= Date.now();
  }

  private async clearUserSession(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { userId },
      data: { sessionState: Prisma.DbNull },
    });
  }
}

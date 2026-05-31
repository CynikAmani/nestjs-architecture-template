import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionGuard } from './auth/guards/permission.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PrismaModule } from './prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class CoreInfrastructureModule {}

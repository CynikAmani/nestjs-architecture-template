import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService, LoginResponse } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

interface RefreshSessionBody {
  userId: string;
  refreshToken: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: RefreshSessionBody): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshSession(body.userId, body.refreshToken);
  }
}

import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from 'event-types';
import { RefreshDto } from 'event-types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserAccountDto, AuthResponseDto, UserMeResponseDto } from 'event-types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // Public — creates a user and returns an immediate token pair (no separate login needed)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  register(@Body() createUserAccountDto: CreateUserAccountDto): Promise<AuthResponseDto> {
    return this.authService.register(createUserAccountDto);
  }

  // Returns both accessToken (15m) and refreshToken (7d)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Stricter limit: 5 requests per minute
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  // Accepts a valid refreshToken and returns a new token pair (rotation)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  // Public endpoint for logout — it verifies the refresh token internally
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('logout')
  logout(@Body() refreshDto: RefreshDto) {
    return this.authService.logout(refreshDto.refreshToken);
  }

  // Protected route — returns the currently authenticated user from the JWT payload
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any): Promise<UserMeResponseDto> {
    //return req.user;
    return this.authService.findme(req.user.id)
  }
}

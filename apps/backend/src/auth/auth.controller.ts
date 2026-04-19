import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserAccountDto } from '../user-account/dto/create-user-account.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Public — creates a user and returns an immediate token pair (no separate login needed)
  @Post('register')
  register(@Body() createUserAccountDto: CreateUserAccountDto) {
    return this.authService.register(createUserAccountDto);
  }

  // Returns both accessToken (15m) and refreshToken (7d)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Accepts a valid refreshToken and returns a new token pair (rotation)
  @Post('refresh')
  refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  // Protected route — returns the currently authenticated user from the JWT payload
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return req.user;
  }
}

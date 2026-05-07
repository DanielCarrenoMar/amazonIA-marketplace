import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'dtos';
import { RefreshDto } from 'dtos';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserAccountDto } from 'dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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

  // Public endpoint for logout — it verifies the refresh token internally
  @Post('logout')
  logout(@Body() refreshDto: RefreshDto) {
    return this.authService.logout(refreshDto.refreshToken);
  }

  // Protected route — returns the currently authenticated user from the JWT payload
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    //return req.user;
    return this.authService.findme(req.user.id)
  }
}

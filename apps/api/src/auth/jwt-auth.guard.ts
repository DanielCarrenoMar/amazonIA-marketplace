import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Reusable guard to protect routes that require a valid JWT
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

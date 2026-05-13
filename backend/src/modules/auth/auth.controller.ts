import { Body, Controller, Post } from '@nestjs/common';
import { AuthService, LoginDto, RegisterDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<{ token: string }> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<{ token: string }> {
    return this.authService.login(dto);
  }
}

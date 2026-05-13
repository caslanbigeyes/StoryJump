import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';

// TODO: 引入 JwtAuthGuard
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    // TODO: req.user 由 JwtAuthGuard 注入
    const userId = req.user?.id ?? 'placeholder';
    return this.userService.getProfile(userId);
  }
}

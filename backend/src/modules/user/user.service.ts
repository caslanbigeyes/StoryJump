import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, credits: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async getProfile(userId: string) {
    // TODO: 返回用户详情（不含密码）
    return this.findById(userId);
  }

  async updateCredits(userId: string, delta: number) {
    // TODO: 更新用户积分，delta 可正可负
    return this.prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: delta } },
    });
  }
}

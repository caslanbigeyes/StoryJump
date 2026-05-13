import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
}

export interface AuthPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ token: string }> {
    // TODO: 检查邮箱是否已存在
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new UnauthorizedException('Email already registered');
    }

    // TODO: 哈希密码并创建用户
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, credits: 100 },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email } as AuthPayload);
    return { token };
  }

  async login(dto: LoginDto): Promise<{ token: string }> {
    // TODO: 查找用户，验证密码
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email } as AuthPayload);
    return { token };
  }

  async validateUser(payload: AuthPayload) {
    // TODO: 根据 JWT payload 查找用户
    return this.prisma.user.findUnique({ where: { id: payload.sub } });
  }
}

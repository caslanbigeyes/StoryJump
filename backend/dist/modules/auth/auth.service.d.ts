import { JwtService } from '@nestjs/jwt';
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
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        token: string;
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
    }>;
    validateUser(payload: AuthPayload): Promise<{
        id: string;
        email: string;
        password: string;
        credits: number;
        createdAt: Date;
    }>;
}

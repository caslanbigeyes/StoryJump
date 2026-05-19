import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, AuthPayload } from './auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly authService;
    constructor(authService: AuthService, configService: ConfigService);
    validate(payload: AuthPayload): Promise<{
        password: string;
        id: string;
        email: string;
        credits: number;
        createdAt: Date;
    }>;
}
export {};

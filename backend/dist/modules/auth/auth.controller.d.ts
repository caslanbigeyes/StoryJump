import { AuthService, LoginDto, RegisterDto } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        token: string;
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
    }>;
}

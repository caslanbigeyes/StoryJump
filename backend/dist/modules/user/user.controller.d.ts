import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        credits: number;
        createdAt: Date;
    }>;
}

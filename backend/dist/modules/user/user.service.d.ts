import { PrismaService } from '../../prisma/prisma.service';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        id: string;
        email: string;
        credits: number;
        createdAt: Date;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        credits: number;
        createdAt: Date;
    }>;
    updateCredits(userId: string, delta: number): Promise<{
        password: string;
        id: string;
        email: string;
        credits: number;
        createdAt: Date;
    }>;
}

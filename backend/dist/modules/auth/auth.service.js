"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const prisma_service_1 = require("../../prisma/prisma.service");
const scrypt = (0, node_util_1.promisify)(node_crypto_1.scrypt);
const PASSWORD_PREFIX = 'scrypt';
async function hashPassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64));
    return `${PASSWORD_PREFIX}:${salt}:${derivedKey.toString('hex')}`;
}
async function verifyPassword(password, storedHash) {
    const [prefix, salt, key] = storedHash.split(':');
    if (prefix !== PASSWORD_PREFIX || !salt || !key)
        return false;
    const storedKey = Buffer.from(key, 'hex');
    const derivedKey = (await scrypt(password, salt, storedKey.length));
    return storedKey.length === derivedKey.length && (0, node_crypto_1.timingSafeEqual)(storedKey, derivedKey);
}
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) {
            throw new common_1.UnauthorizedException('Email already registered');
        }
        const hashed = await hashPassword(dto.password);
        const user = await this.prisma.user.create({
            data: { email: dto.email, password: hashed, credits: 100 },
        });
        const token = this.jwtService.sign({ sub: user.id, email: user.email });
        return { token };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordMatch = await verifyPassword(dto.password, user.password);
        if (!passwordMatch) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const token = this.jwtService.sign({ sub: user.id, email: user.email });
        return { token };
    }
    async validateUser(payload) {
        return this.prisma.user.findUnique({ where: { id: payload.sub } });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
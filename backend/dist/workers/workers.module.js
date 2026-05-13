"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkersModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
const providers_module_1 = require("../providers/providers.module");
const pipeline_worker_1 = require("./pipeline.worker");
let WorkersModule = class WorkersModule {
};
exports.WorkersModule = WorkersModule;
exports.WorkersModule = WorkersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const redisUrl = configService.get('REDIS_URL') ?? 'redis://localhost:6379';
                    const url = new URL(redisUrl);
                    return {
                        redis: { host: url.hostname, port: parseInt(url.port) || 6379 },
                    };
                },
                inject: [config_1.ConfigService],
            }),
            bull_1.BullModule.registerQueue({ name: pipeline_worker_1.STORY_PIPELINE_QUEUE }),
            providers_module_1.ProvidersModule,
        ],
        providers: [prisma_service_1.PrismaService, pipeline_worker_1.PipelineWorker],
    })
], WorkersModule);
//# sourceMappingURL=workers.module.js.map
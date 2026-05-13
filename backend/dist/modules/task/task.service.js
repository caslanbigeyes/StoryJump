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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = exports.CreateTaskDto = exports.MainCharacterDto = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const bull_1 = require("@nestjs/bull");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../../prisma/prisma.service");
const task_status_enum_1 = require("../../common/enums/task-status.enum");
const pipeline_worker_1 = require("../../workers/pipeline.worker");
class MainCharacterDto {
}
exports.MainCharacterDto = MainCharacterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MainCharacterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MainCharacterDto.prototype, "age", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MainCharacterDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MainCharacterDto.prototype, "appearance", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MainCharacterDto.prototype, "personality", void 0);
class CreateTaskDto {
}
exports.CreateTaskDto = CreateTaskDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "genre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "era", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "tone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(600),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "target_duration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "shot_count", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "aspect_ratio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "visual_style", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MainCharacterDto),
    __metadata("design:type", Array)
], CreateTaskDto.prototype, "main_characters", void 0);
let TaskService = class TaskService {
    constructor(prisma, pipelineQueue) {
        this.prisma = prisma;
        this.pipelineQueue = pipelineQueue;
    }
    async createTask(userId, dto) {
        const input = {
            title: dto.title,
            topic: dto.topic,
            genre: dto.genre ?? 'general',
            era: dto.era ?? 'contemporary',
            location: dto.location ?? 'unspecified',
            tone: dto.tone ?? '温暖、真实',
            target_duration: dto.target_duration ?? 120,
            shot_count: dto.shot_count ?? 20,
            aspect_ratio: dto.aspect_ratio ?? '9:16',
            language: dto.language ?? 'zh-CN',
            visual_style: dto.visual_style ?? 'cinematic realism',
            main_characters: dto.main_characters ?? [],
        };
        const task = await this.prisma.task.create({
            data: {
                userId,
                title: dto.title,
                status: task_status_enum_1.TaskStatus.PENDING,
                currentStep: task_status_enum_1.TaskStep.CREATE_SCRIPT,
                progress: 0,
                inputJson: JSON.stringify(input),
            },
        });
        await this.pipelineQueue.add(task_status_enum_1.TaskStep.CREATE_SCRIPT, { taskId: task.id, input }, { attempts: 3, backoff: { type: 'exponential', delay: 3000 } });
        return {
            taskId: task.id,
            status: task.status,
            currentStep: task.currentStep,
        };
    }
    async listTasks(userId, pagination) {
        const [data, total] = await Promise.all([
            this.prisma.task.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip: pagination.skip,
                take: pagination.limit,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    currentStep: true,
                    progress: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            this.prisma.task.count({ where: { userId } }),
        ]);
        return { data, total, page: pagination.page, limit: pagination.limit };
    }
    async getTaskById(taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { shots: { orderBy: { shotIndex: 'asc' } } },
        });
        if (!task)
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
        return task;
    }
    async getTaskStatus(taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: {
                status: true,
                currentStep: true,
                progress: true,
                errorMessage: true,
            },
        });
        if (!task)
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
        return task;
    }
    async getTaskShots(taskId) {
        return this.prisma.shot.findMany({
            where: { taskId },
            orderBy: { shotIndex: 'asc' },
        });
    }
    async getTaskResult(taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { status: true, outputJson: true, errorMessage: true },
        });
        if (!task)
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
        if (!task.outputJson)
            return null;
        return JSON.parse(task.outputJson);
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)(pipeline_worker_1.STORY_PIPELINE_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_1.Queue])
], TaskService);
//# sourceMappingURL=task.service.js.map
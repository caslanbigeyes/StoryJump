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
var StoryboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const llm_provider_1 = require("../../providers/llm/llm.provider");
let StoryboardService = StoryboardService_1 = class StoryboardService {
    constructor(prisma, llmProvider) {
        this.prisma = prisma;
        this.llmProvider = llmProvider;
        this.logger = new common_1.Logger(StoryboardService_1.name);
    }
    async splitIntoShots(taskId, script, input) {
        this.logger.log(`Splitting script into shots for task ${taskId}`);
        return this.llmProvider.splitStoryboard(script, input);
    }
    async resplitTaskShots(taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                inputJson: true,
                outputJson: true,
            },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
        }
        if (!task.inputJson || !task.outputJson) {
            throw new common_1.NotFoundException(`Task ${taskId} script or input not found`);
        }
        const input = JSON.parse(task.inputJson);
        const output = JSON.parse(task.outputJson);
        const shots = await this.splitIntoShots(task.id, output.script, input);
        const nextOutput = {
            ...output,
            shots,
            meta: {
                ...output.meta,
                shot_count: shots.length,
            },
            validation: {
                ...output.validation,
                shot_count_match: shots.length === input.shot_count,
            },
        };
        await this.prisma.$transaction(async (tx) => {
            await tx.shot.deleteMany({ where: { taskId } });
            if (shots.length > 0) {
                await tx.shot.createMany({
                    data: shots.map((shot) => ({
                        taskId,
                        shotIndex: shot.shot_id,
                        sceneText: shot.scene,
                        cameraAngle: `${shot.camera.shot_size}, ${shot.camera.angle}, ${shot.camera.movement}`,
                        characterAction: shot.action,
                        imagePrompt: shot.image_prompt,
                        imageUrl: null,
                        audioUrl: null,
                        status: 'pending',
                    })),
                });
            }
            await tx.task.update({
                where: { id: taskId },
                data: {
                    outputJson: JSON.stringify(nextOutput),
                    currentStep: 'done',
                    progress: 100,
                },
            });
        });
        return nextOutput;
    }
    async updateShot(shotId, data) {
        const shot = await this.prisma.shot.update({
            where: { id: shotId },
            data,
        });
        const task = await this.prisma.task.findUnique({
            where: { id: shot.taskId },
            select: { outputJson: true },
        });
        if (task?.outputJson) {
            const output = JSON.parse(task.outputJson);
            const nextShots = output.shots.map((item) => {
                if (item.shot_id !== shot.shotIndex)
                    return item;
                return {
                    ...item,
                    scene: data.sceneText ?? item.scene,
                    action: data.characterAction ?? item.action,
                    image_prompt: data.imagePrompt ?? item.image_prompt,
                    camera: data.cameraAngle
                        ? { ...item.camera, angle: data.cameraAngle }
                        : item.camera,
                };
            });
            await this.prisma.task.update({
                where: { id: shot.taskId },
                data: {
                    outputJson: JSON.stringify({ ...output, shots: nextShots }),
                },
            });
        }
        return shot;
    }
    async getShotsByTask(taskId) {
        return this.prisma.shot.findMany({ where: { taskId }, orderBy: { shotIndex: 'asc' } });
    }
    async getShotById(shotId) {
        const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
        if (!shot)
            throw new common_1.NotFoundException(`Shot ${shotId} not found`);
        return shot;
    }
};
exports.StoryboardService = StoryboardService;
exports.StoryboardService = StoryboardService = StoryboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(llm_provider_1.LLM_PROVIDER_TOKEN)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_provider_1.LLMProvider])
], StoryboardService);
//# sourceMappingURL=storyboard.service.js.map
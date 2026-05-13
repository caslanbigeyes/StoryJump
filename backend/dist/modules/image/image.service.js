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
var ImageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageService = void 0;
const common_1 = require("@nestjs/common");
const image_provider_1 = require("../../providers/image/image.provider");
const prisma_service_1 = require("../../prisma/prisma.service");
const task_status_enum_1 = require("../../common/enums/task-status.enum");
let ImageService = ImageService_1 = class ImageService {
    constructor(prisma, imageProvider) {
        this.prisma = prisma;
        this.imageProvider = imageProvider;
        this.logger = new common_1.Logger(ImageService_1.name);
    }
    async generateImageForShot(shotId, prompt, options) {
        this.logger.log(`Generating image for shot ${shotId}`);
        const imageUrl = await this.imageProvider.generateImage(prompt, options);
        await this.prisma.shot.update({
            where: { id: shotId },
            data: { imageUrl, status: 'image_done' },
        });
        return imageUrl;
    }
    async regenerateImage(shotId, options) {
        const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
        if (!shot?.imagePrompt)
            throw new Error(`Shot ${shotId} has no image prompt`);
        return this.generateImageForShot(shotId, shot.imagePrompt, options);
    }
    async generateImagesForTask(taskId, options) {
        const shots = await this.prisma.shot.findMany({
            where: { taskId },
            orderBy: { shotIndex: 'asc' },
        });
        await this.prisma.task.update({
            where: { id: taskId },
            data: {
                currentStep: task_status_enum_1.TaskStep.GENERATE_IMAGES,
                progress: 60,
                errorMessage: null,
            },
        });
        let successCount = 0;
        let failedCount = 0;
        for (const shot of shots) {
            if (!shot.imagePrompt) {
                failedCount++;
                await this.prisma.shot.update({
                    where: { id: shot.id },
                    data: { status: 'image_failed' },
                });
                continue;
            }
            try {
                await this.generateImageForShot(shot.id, shot.imagePrompt, options);
                successCount++;
            }
            catch (error) {
                failedCount++;
                this.logger.error(`Batch image generation failed for shot ${shot.id}: ${error instanceof Error ? error.message : String(error)}`);
                await this.prisma.shot.update({
                    where: { id: shot.id },
                    data: { status: 'image_failed' },
                });
            }
        }
        await this.prisma.task.update({
            where: { id: taskId },
            data: {
                currentStep: task_status_enum_1.TaskStep.DONE,
                progress: 100,
                ...(failedCount > 0 ? { errorMessage: `${failedCount}/${shots.length} shots failed to generate image` } : {}),
            },
        });
        return {
            total: shots.length,
            successCount,
            failedCount,
        };
    }
};
exports.ImageService = ImageService;
exports.ImageService = ImageService = ImageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        image_provider_1.ImageProvider])
], ImageService);
//# sourceMappingURL=image.service.js.map
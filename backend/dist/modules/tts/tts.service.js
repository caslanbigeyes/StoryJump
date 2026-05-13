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
var TtsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtsService = void 0;
const common_1 = require("@nestjs/common");
const tts_provider_1 = require("../../providers/tts/tts.provider");
const prisma_service_1 = require("../../prisma/prisma.service");
const task_status_enum_1 = require("../../common/enums/task-status.enum");
let TtsService = TtsService_1 = class TtsService {
    constructor(prisma, ttsProvider) {
        this.prisma = prisma;
        this.ttsProvider = ttsProvider;
        this.logger = new common_1.Logger(TtsService_1.name);
    }
    async generateAudioForShot(shotId, text, options) {
        this.logger.log(`Generating TTS audio for shot ${shotId}`);
        const audioUrl = await this.ttsProvider.generateVoice(text, options);
        await this.prisma.shot.update({
            where: { id: shotId },
            data: { audioUrl, status: 'tts_done' },
        });
        return audioUrl;
    }
    async regenerateAudio(shotId, options) {
        const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
        if (!shot?.sceneText)
            throw new Error(`Shot ${shotId} has no scene text`);
        return this.generateAudioForShot(shotId, shot.sceneText, options);
    }
    async generateAudioForTask(taskId, options) {
        const shots = await this.prisma.shot.findMany({
            where: { taskId },
            orderBy: { shotIndex: 'asc' },
        });
        await this.prisma.task.update({
            where: { id: taskId },
            data: {
                currentStep: task_status_enum_1.TaskStep.GENERATE_TTS,
                progress: 85,
                errorMessage: null,
            },
        });
        let successCount = 0;
        let failedCount = 0;
        for (const shot of shots) {
            if (!shot.sceneText) {
                failedCount++;
                await this.prisma.shot.update({
                    where: { id: shot.id },
                    data: { status: 'tts_failed' },
                });
                continue;
            }
            try {
                await this.generateAudioForShot(shot.id, shot.sceneText, options);
                successCount++;
            }
            catch (error) {
                failedCount++;
                this.logger.error(`Batch audio generation failed for shot ${shot.id}: ${error instanceof Error ? error.message : String(error)}`);
                await this.prisma.shot.update({
                    where: { id: shot.id },
                    data: { status: 'tts_failed' },
                });
            }
        }
        await this.prisma.task.update({
            where: { id: taskId },
            data: {
                currentStep: task_status_enum_1.TaskStep.DONE,
                progress: 100,
                ...(failedCount > 0 ? { errorMessage: `${failedCount}/${shots.length} shots failed to generate audio` } : {}),
            },
        });
        return {
            total: shots.length,
            successCount,
            failedCount,
        };
    }
};
exports.TtsService = TtsService;
exports.TtsService = TtsService = TtsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tts_provider_1.TTSProvider])
], TtsService);
//# sourceMappingURL=tts.service.js.map
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
var PipelineWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineWorker = exports.STORY_PIPELINE_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const llm_provider_1 = require("../providers/llm/llm.provider");
const image_provider_1 = require("../providers/image/image.provider");
const tts_provider_1 = require("../providers/tts/tts.provider");
const task_status_enum_1 = require("../common/enums/task-status.enum");
const create_script_job_1 = require("./jobs/create-script.job");
const split_storyboard_job_1 = require("./jobs/split-storyboard.job");
const generate_prompts_job_1 = require("./jobs/generate-prompts.job");
const generate_images_job_1 = require("./jobs/generate-images.job");
const generate_tts_job_1 = require("./jobs/generate-tts.job");
exports.STORY_PIPELINE_QUEUE = 'story-pipeline';
let PipelineWorker = PipelineWorker_1 = class PipelineWorker {
    constructor(configService, prisma, llmProvider, imageProvider, ttsProvider) {
        this.configService = configService;
        this.prisma = prisma;
        this.llmProvider = llmProvider;
        this.imageProvider = imageProvider;
        this.ttsProvider = ttsProvider;
        this.logger = new common_1.Logger(PipelineWorker_1.name);
    }
    onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL') ?? 'redis://localhost:6379';
        const url = new URL(redisUrl);
        this.worker = new bullmq_1.Worker(exports.STORY_PIPELINE_QUEUE, async (job) => {
            this.logger.log(`Processing job: ${job.name}, taskId: ${job.data?.taskId}`);
            await this.processJob(job);
        }, {
            connection: { host: url.hostname, port: parseInt(url.port) || 6379 },
            concurrency: 3,
        });
        this.worker.on('completed', (job) => {
            this.logger.log(`Job ${job.id} (${job.name}) completed`);
        });
        this.worker.on('failed', async (job, error) => {
            this.logger.error(`Job ${job?.id} (${job?.name}) failed: ${error.message}`);
            if (job?.data?.taskId) {
                await this.prisma.task.update({
                    where: { id: job.data.taskId },
                    data: { status: task_status_enum_1.TaskStatus.FAILED },
                });
            }
        });
        this.logger.log(`Pipeline worker started, queue: ${exports.STORY_PIPELINE_QUEUE}`);
    }
    async processJob(job) {
        switch (job.name) {
            case task_status_enum_1.TaskStep.CREATE_SCRIPT:
                await (0, create_script_job_1.handleCreateScriptJob)(job, this.prisma, this.llmProvider);
                break;
            case task_status_enum_1.TaskStep.SPLIT_STORYBOARD:
                await (0, split_storyboard_job_1.handleSplitStoryboardJob)(job, this.prisma, this.llmProvider);
                break;
            case task_status_enum_1.TaskStep.GENERATE_PROMPTS:
                await (0, generate_prompts_job_1.handleGeneratePromptsJob)(job, this.prisma, this.llmProvider);
                break;
            case task_status_enum_1.TaskStep.GENERATE_IMAGES:
                await (0, generate_images_job_1.handleGenerateImagesJob)(job, this.prisma, this.imageProvider);
                break;
            case task_status_enum_1.TaskStep.GENERATE_TTS:
                await (0, generate_tts_job_1.handleGenerateTTSJob)(job, this.prisma, this.ttsProvider);
                break;
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }
};
exports.PipelineWorker = PipelineWorker;
exports.PipelineWorker = PipelineWorker = PipelineWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(llm_provider_1.LLM_PROVIDER_TOKEN)),
    __param(3, (0, common_1.Inject)(image_provider_1.IMAGE_PROVIDER_TOKEN)),
    __param(4, (0, common_1.Inject)(tts_provider_1.TTS_PROVIDER_TOKEN)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        llm_provider_1.LLMProvider,
        image_provider_1.ImageProvider,
        tts_provider_1.TTSProvider])
], PipelineWorker);
//# sourceMappingURL=pipeline.worker.js.map
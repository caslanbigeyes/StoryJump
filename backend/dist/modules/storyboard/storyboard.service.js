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
    async updateShot(shotId, data) {
        return this.prisma.shot.update({ where: { id: shotId }, data });
    }
    async getShotsByTask(taskId) {
        return this.prisma.shot.findMany({ where: { taskId }, orderBy: { shotIndex: 'asc' } });
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
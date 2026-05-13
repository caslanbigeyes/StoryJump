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
var ScriptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const llm_provider_1 = require("../../providers/llm/llm.provider");
let ScriptService = ScriptService_1 = class ScriptService {
    constructor(prisma, llmProvider) {
        this.prisma = prisma;
        this.llmProvider = llmProvider;
        this.logger = new common_1.Logger(ScriptService_1.name);
    }
    async generateScript(input) {
        this.logger.log(`Generating script for: ${input.title}`);
        return this.llmProvider.generateScript(input);
    }
    async rewriteScript(script, instructions) {
        this.logger.log(`Rewriting script with instructions: ${instructions ?? 'default'}`);
        return {
            ...script,
            narration: `${script.narration}\n\n改写要求：${instructions ?? '优化节奏与表达'}`,
        };
    }
    async getTaskResult(taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { outputJson: true },
        });
        if (!task?.outputJson) {
            throw new common_1.NotFoundException(`Task ${taskId} result not found`);
        }
        return JSON.parse(task.outputJson);
    }
    async updateTaskScript(taskId, script) {
        const result = await this.getTaskResult(taskId);
        const nextResult = {
            ...result,
            script,
        };
        await this.prisma.task.update({
            where: { id: taskId },
            data: { outputJson: JSON.stringify(nextResult) },
        });
        return nextResult;
    }
    async rewriteTaskScript(taskId, instructions) {
        const result = await this.getTaskResult(taskId);
        const rewritten = await this.rewriteScript(result.script, instructions);
        return this.updateTaskScript(taskId, rewritten);
    }
};
exports.ScriptService = ScriptService;
exports.ScriptService = ScriptService = ScriptService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(llm_provider_1.LLM_PROVIDER_TOKEN)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_provider_1.LLMProvider])
], ScriptService);
//# sourceMappingURL=script.service.js.map
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
exports.TaskController = void 0;
const common_1 = require("@nestjs/common");
const task_service_1 = require("./task.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const script_service_1 = require("../script/script.service");
const storyboard_service_1 = require("../storyboard/storyboard.service");
const image_service_1 = require("../image/image.service");
const tts_service_1 = require("../tts/tts.service");
const video_service_1 = require("../video/video.service");
let TaskController = class TaskController {
    constructor(taskService, scriptService, storyboardService, imageService, ttsService, videoService) {
        this.taskService = taskService;
        this.scriptService = scriptService;
        this.storyboardService = storyboardService;
        this.imageService = imageService;
        this.ttsService = ttsService;
        this.videoService = videoService;
    }
    async createTask(req, dto) {
        const userId = req.user?.id;
        return this.taskService.createTask(userId, dto);
    }
    async listTasks(req, pagination) {
        const userId = req.user?.id;
        return this.taskService.listTasks(userId, pagination);
    }
    async getTask(id) {
        return this.taskService.getTaskById(id);
    }
    async getTaskStatus(id) {
        return this.taskService.getTaskStatus(id);
    }
    async getTaskShots(id) {
        return this.taskService.getTaskShots(id);
    }
    async getTaskResult(id) {
        return this.taskService.getTaskResult(id);
    }
    async updateTaskScript(id, script) {
        return this.scriptService.updateTaskScript(id, script);
    }
    async rewriteTaskScript(id, dto) {
        return this.scriptService.rewriteTaskScript(id, dto.instructions);
    }
    async resplitTaskStoryboard(id) {
        return this.storyboardService.resplitTaskShots(id);
    }
    async updateShot(shotId, dto) {
        return this.storyboardService.updateShot(shotId, dto);
    }
    async regenerateShotImage(shotId) {
        const imageUrl = await this.imageService.regenerateImage(shotId);
        return { imageUrl };
    }
    async regenerateTaskImages(id) {
        return this.imageService.generateImagesForTask(id);
    }
    async regenerateShotAudio(shotId) {
        const audioUrl = await this.ttsService.regenerateAudio(shotId);
        return { audioUrl };
    }
    async regenerateTaskAudio(id) {
        return this.ttsService.generateAudioForTask(id);
    }
    async retryTask(id, req) {
        const userId = req.user?.id;
        return this.taskService.retryTask(id, userId);
    }
    async getTaskVideo(id) {
        return this.videoService.getTaskVideo(id);
    }
    async exportTaskVideo(id, dto) {
        return this.videoService.startTaskVideoExport(id, dto);
    }
};
exports.TaskController = TaskController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, task_service_1.CreateTaskDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "createTask", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTask", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTaskStatus", null);
__decorate([
    (0, common_1.Get)(':id/shots'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTaskShots", null);
__decorate([
    (0, common_1.Get)(':id/result'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTaskResult", null);
__decorate([
    (0, common_1.Patch)(':id/script'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "updateTaskScript", null);
__decorate([
    (0, common_1.Post)(':id/script/rewrite'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "rewriteTaskScript", null);
__decorate([
    (0, common_1.Post)(':id/storyboard/resplit'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "resplitTaskStoryboard", null);
__decorate([
    (0, common_1.Patch)('shots/:shotId'),
    __param(0, (0, common_1.Param)('shotId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "updateShot", null);
__decorate([
    (0, common_1.Post)('shots/:shotId/regenerate-image'),
    __param(0, (0, common_1.Param)('shotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "regenerateShotImage", null);
__decorate([
    (0, common_1.Post)(':id/images/regenerate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "regenerateTaskImages", null);
__decorate([
    (0, common_1.Post)('shots/:shotId/regenerate-audio'),
    __param(0, (0, common_1.Param)('shotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "regenerateShotAudio", null);
__decorate([
    (0, common_1.Post)(':id/audio/regenerate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "regenerateTaskAudio", null);
__decorate([
    (0, common_1.Post)(':id/retry'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "retryTask", null);
__decorate([
    (0, common_1.Get)(':id/video'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTaskVideo", null);
__decorate([
    (0, common_1.Post)(':id/video/export'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "exportTaskVideo", null);
exports.TaskController = TaskController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [task_service_1.TaskService,
        script_service_1.ScriptService,
        storyboard_service_1.StoryboardService,
        image_service_1.ImageService,
        tts_service_1.TtsService,
        video_service_1.VideoService])
], TaskController);
//# sourceMappingURL=task.controller.js.map
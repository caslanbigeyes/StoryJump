"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const task_controller_1 = require("./task.controller");
const task_service_1 = require("./task.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_module_1 = require("../auth/auth.module");
const pipeline_worker_1 = require("../../workers/pipeline.worker");
const script_module_1 = require("../script/script.module");
const storyboard_module_1 = require("../storyboard/storyboard.module");
const image_module_1 = require("../image/image.module");
const tts_module_1 = require("../tts/tts.module");
const video_module_1 = require("../video/video.module");
let TaskModule = class TaskModule {
};
exports.TaskModule = TaskModule;
exports.TaskModule = TaskModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            script_module_1.ScriptModule,
            storyboard_module_1.StoryboardModule,
            image_module_1.ImageModule,
            tts_module_1.TtsModule,
            video_module_1.VideoModule,
            bull_1.BullModule.registerQueue({ name: pipeline_worker_1.STORY_PIPELINE_QUEUE }),
        ],
        controllers: [task_controller_1.TaskController],
        providers: [task_service_1.TaskService, prisma_service_1.PrismaService],
        exports: [task_service_1.TaskService],
    })
], TaskModule);
//# sourceMappingURL=task.module.js.map
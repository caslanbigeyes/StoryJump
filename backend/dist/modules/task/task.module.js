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
let TaskModule = class TaskModule {
};
exports.TaskModule = TaskModule;
exports.TaskModule = TaskModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            bull_1.BullModule.registerQueue({ name: pipeline_worker_1.STORY_PIPELINE_QUEUE }),
        ],
        controllers: [task_controller_1.TaskController],
        providers: [task_service_1.TaskService, prisma_service_1.PrismaService],
        exports: [task_service_1.TaskService],
    })
], TaskModule);
//# sourceMappingURL=task.module.js.map
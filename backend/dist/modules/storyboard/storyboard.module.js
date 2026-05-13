"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryboardModule = void 0;
const common_1 = require("@nestjs/common");
const storyboard_service_1 = require("./storyboard.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const providers_module_1 = require("../../providers/providers.module");
let StoryboardModule = class StoryboardModule {
};
exports.StoryboardModule = StoryboardModule;
exports.StoryboardModule = StoryboardModule = __decorate([
    (0, common_1.Module)({
        imports: [providers_module_1.ProvidersModule],
        providers: [storyboard_service_1.StoryboardService, prisma_service_1.PrismaService],
        exports: [storyboard_service_1.StoryboardService],
    })
], StoryboardModule);
//# sourceMappingURL=storyboard.module.js.map
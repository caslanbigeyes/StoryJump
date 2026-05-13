"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtsModule = void 0;
const common_1 = require("@nestjs/common");
const tts_service_1 = require("./tts.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const volcano_provider_1 = require("../../providers/tts/volcano.provider");
const tts_provider_1 = require("../../providers/tts/tts.provider");
let TtsModule = class TtsModule {
};
exports.TtsModule = TtsModule;
exports.TtsModule = TtsModule = __decorate([
    (0, common_1.Module)({
        providers: [
            tts_service_1.TtsService,
            prisma_service_1.PrismaService,
            {
                provide: tts_provider_1.TTSProvider,
                useClass: volcano_provider_1.VolcanoTTSProvider,
            },
        ],
        exports: [tts_service_1.TtsService],
    })
], TtsModule);
//# sourceMappingURL=tts.module.js.map
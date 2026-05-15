"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const llm_provider_1 = require("./llm/llm.provider");
const bigmodel_provider_1 = require("./llm/bigmodel.provider");
const image_provider_1 = require("./image/image.provider");
const kling_provider_1 = require("./image/kling.provider");
const tts_provider_1 = require("./tts/tts.provider");
const siliconflow_provider_1 = require("./tts/siliconflow.provider");
let ProvidersModule = class ProvidersModule {
};
exports.ProvidersModule = ProvidersModule;
exports.ProvidersModule = ProvidersModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: llm_provider_1.LLM_PROVIDER_TOKEN,
                useClass: bigmodel_provider_1.BigModelProvider,
            },
            {
                provide: image_provider_1.IMAGE_PROVIDER_TOKEN,
                useClass: kling_provider_1.KlingImageProvider,
            },
            {
                provide: tts_provider_1.TTS_PROVIDER_TOKEN,
                useClass: siliconflow_provider_1.SiliconFlowTTSProvider,
            },
        ],
        exports: [llm_provider_1.LLM_PROVIDER_TOKEN, image_provider_1.IMAGE_PROVIDER_TOKEN, tts_provider_1.TTS_PROVIDER_TOKEN],
    })
], ProvidersModule);
//# sourceMappingURL=providers.module.js.map
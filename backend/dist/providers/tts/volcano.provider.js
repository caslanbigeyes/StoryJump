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
var VolcanoTTSProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolcanoTTSProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tts_provider_1 = require("./tts.provider");
let VolcanoTTSProvider = VolcanoTTSProvider_1 = class VolcanoTTSProvider extends tts_provider_1.TTSProvider {
    constructor(configService) {
        super();
        this.configService = configService;
        this.logger = new common_1.Logger(VolcanoTTSProvider_1.name);
        this.appId = this.configService.get('TTS_APP_ID') ?? '';
        this.accessKey = this.configService.get('TTS_ACCESS_KEY') ?? '';
        this.secretKey = this.configService.get('TTS_SECRET_KEY') ?? '';
    }
    async generateVoice(text, options) {
        this.logger.log(`Generating TTS voice for text: ${text.substring(0, 30)}...`);
        if (!this.appId || !this.accessKey || !this.secretKey) {
            throw new Error('TTS 未配置：缺少 TTS_APP_ID、TTS_ACCESS_KEY 或 TTS_SECRET_KEY，无法生成配音');
        }
        const payload = {
            app: {
                appid: this.appId,
                token: this.accessKey,
                cluster: options?.cluster ?? 'volcano_tts',
            },
            user: {
                uid: options?.uid ?? 'storyjump_user',
            },
            audio: {
                voice_type: options?.voiceType ?? 'zh_female_tianmeixiaoyuan_moon_bigtts',
                encoding: 'mp3',
                speed_ratio: options?.speedRatio ?? 1.0,
                volume_ratio: options?.volumeRatio ?? 1.0,
                pitch_ratio: options?.pitchRatio ?? 1.0,
            },
            request: {
                reqid: Date.now().toString(),
                text,
                text_type: 'plain',
                operation: 'query',
            },
        };
        this.logger.debug('TTS payload prepared', payload);
        throw new Error('TTS provider 尚未接入真实火山引擎接口，当前不会生成可播放音频');
    }
};
exports.VolcanoTTSProvider = VolcanoTTSProvider;
exports.VolcanoTTSProvider = VolcanoTTSProvider = VolcanoTTSProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VolcanoTTSProvider);
//# sourceMappingURL=volcano.provider.js.map
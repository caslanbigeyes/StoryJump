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
var FluxImageProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluxImageProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const image_provider_1 = require("./image.provider");
const ASPECT_RATIO_SIZE = {
    '9:16': '1024x1536',
    '16:9': '1536x1024',
    '1:1': '1024x1024',
};
let FluxImageProvider = FluxImageProvider_1 = class FluxImageProvider extends image_provider_1.ImageProvider {
    constructor(configService) {
        super();
        this.configService = configService;
        this.logger = new common_1.Logger(FluxImageProvider_1.name);
        const apiKey = this.configService.get('IMAGE_API_KEY') ?? '';
        const baseURL = this.configService.get('IMAGE_API_BASE_URL') ?? 'https://api.openai.com/v1';
        this.model = this.configService.get('IMAGE_MODEL') ?? 'gpt-image-1';
        this.http = axios_1.default.create({
            baseURL,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 120_000,
        });
    }
    async generateImage(prompt, options) {
        const aspectRatio = options?.aspect_ratio ?? '9:16';
        const size = ASPECT_RATIO_SIZE[aspectRatio] ?? '1024x1536';
        const quality = options?.quality ?? 'medium';
        this.logger.log(`[generateImage] model=${this.model} size=${size} quality=${quality} prompt="${prompt.slice(0, 60)}..."`);
        const body = {
            model: this.model,
            prompt,
            n: 1,
            size,
            quality,
        };
        let resp;
        try {
            resp = await this.http.post('/images/generations', body);
        }
        catch (err) {
            const detail = err?.response?.data?.error ?? err?.message ?? String(err);
            this.logger.error(`[generateImage] API error: ${JSON.stringify(detail)}`);
            throw new Error(typeof detail === 'object' ? (detail.message ?? JSON.stringify(detail)) : detail);
        }
        const item = resp.data?.data?.[0];
        if (!item) {
            throw new Error(`[FluxImageProvider] Empty response from ${this.model}`);
        }
        if (item.url) {
            this.logger.log(`[generateImage] got URL: ${item.url.slice(0, 60)}...`);
            return item.url;
        }
        if (item.b64_json) {
            const dataUrl = `data:image/png;base64,${item.b64_json}`;
            this.logger.log(`[generateImage] got b64_json (len=${item.b64_json.length}), returning data URL`);
            return dataUrl;
        }
        throw new Error(`[FluxImageProvider] Response has neither url nor b64_json`);
    }
};
exports.FluxImageProvider = FluxImageProvider;
exports.FluxImageProvider = FluxImageProvider = FluxImageProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FluxImageProvider);
//# sourceMappingURL=flux.provider.js.map
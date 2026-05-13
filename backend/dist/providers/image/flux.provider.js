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
let FluxImageProvider = FluxImageProvider_1 = class FluxImageProvider extends image_provider_1.ImageProvider {
    constructor(configService) {
        super();
        this.configService = configService;
        this.logger = new common_1.Logger(FluxImageProvider_1.name);
        this.apiKey = this.configService.get('IMAGE_API_KEY') ?? '';
        this.baseUrl =
            this.configService.get('IMAGE_API_BASE_URL') ?? 'https://api.replicate.com/v1';
        this.model =
            this.configService.get('IMAGE_MODEL') ?? 'black-forest-labs/flux-schnell';
    }
    async generateImage(prompt, options) {
        this.logger.log(`Generating image with Flux model, prompt: ${prompt.substring(0, 50)}...`);
        const response = await axios_1.default.post(`${this.baseUrl}/predictions`, {
            version: this.model,
            input: {
                prompt,
                width: options?.width ?? 1024,
                height: options?.height ?? 576,
                num_outputs: 1,
                ...options,
            },
        }, {
            headers: {
                Authorization: `Token ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data.output?.[0] ?? '';
    }
};
exports.FluxImageProvider = FluxImageProvider;
exports.FluxImageProvider = FluxImageProvider = FluxImageProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FluxImageProvider);
//# sourceMappingURL=flux.provider.js.map
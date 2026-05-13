import { ConfigService } from '@nestjs/config';
import { TTSProvider } from './tts.provider';
export declare class VolcanoTTSProvider extends TTSProvider {
    private readonly configService;
    private readonly logger;
    private readonly appId;
    private readonly accessKey;
    private readonly secretKey;
    constructor(configService: ConfigService);
    generateVoice(text: string, options?: Record<string, unknown>): Promise<string>;
}

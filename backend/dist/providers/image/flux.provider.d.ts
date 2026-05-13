import { ConfigService } from '@nestjs/config';
import { ImageProvider } from './image.provider';
export declare class FluxImageProvider extends ImageProvider {
    private readonly configService;
    private readonly logger;
    private readonly http;
    private readonly model;
    constructor(configService: ConfigService);
    generateImage(prompt: string, options?: Record<string, unknown>): Promise<string>;
}

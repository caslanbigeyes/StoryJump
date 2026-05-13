import { ConfigService } from '@nestjs/config';
export interface UploadResult {
    url: string;
    key: string;
    provider: string;
}
export declare class StorageService {
    private readonly configService;
    private readonly logger;
    private readonly secretId;
    private readonly secretKey;
    private readonly bucket;
    private readonly region;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<UploadResult>;
    uploadFromUrl(sourceUrl: string, key: string): Promise<UploadResult>;
    deleteFile(key: string): Promise<void>;
    buildKey(taskId: string, type: 'image' | 'audio' | 'video', filename: string): string;
}

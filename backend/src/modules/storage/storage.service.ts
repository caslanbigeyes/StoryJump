import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UploadResult {
  url: string;
  key: string;
  provider: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly secretId: string;
  private readonly secretKey: string;
  private readonly bucket: string;
  private readonly region: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.secretId = this.configService.get<string>('COS_SECRET_ID') ?? '';
    this.secretKey = this.configService.get<string>('COS_SECRET_KEY') ?? '';
    this.bucket = this.configService.get<string>('COS_BUCKET') ?? '';
    this.region = this.configService.get<string>('COS_REGION') ?? 'ap-guangzhou';
    this.baseUrl = this.configService.get<string>('COS_BASE_URL') ?? '';
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<UploadResult> {
    this.logger.log(`Uploading file: ${key} (${contentType})`);
    // TODO: 实现腾讯云 COS 上传逻辑
    // const cos = new COS({ SecretId: this.secretId, SecretKey: this.secretKey });
    // await cos.putObject({ Bucket: this.bucket, Region: this.region, Key: key, Body: buffer });
    return {
      url: `${this.baseUrl}/${key}`,
      key,
      provider: 'tencent-cos',
    };
  }

  async uploadFromUrl(sourceUrl: string, key: string): Promise<UploadResult> {
    // TODO: 从 URL 下载文件后上传到 COS
    this.logger.log(`Uploading from URL to key: ${key}`);
    return {
      url: `${this.baseUrl}/${key}`,
      key,
      provider: 'tencent-cos',
    };
  }

  async deleteFile(key: string): Promise<void> {
    // TODO: 从 COS 删除文件
    this.logger.log(`Deleting file: ${key}`);
  }

  buildKey(taskId: string, type: 'image' | 'audio' | 'video', filename: string): string {
    return `storyjump/${type}/${taskId}/${filename}`;
  }
}

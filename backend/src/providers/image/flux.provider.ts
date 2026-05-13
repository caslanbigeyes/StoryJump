import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ImageProvider } from './image.provider';

@Injectable()
export class FluxImageProvider extends ImageProvider {
  private readonly logger = new Logger(FluxImageProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.apiKey = this.configService.get<string>('IMAGE_API_KEY') ?? '';
    this.baseUrl =
      this.configService.get<string>('IMAGE_API_BASE_URL') ?? 'https://api.replicate.com/v1';
    this.model =
      this.configService.get<string>('IMAGE_MODEL') ?? 'black-forest-labs/flux-schnell';
  }

  async generateImage(prompt: string, options?: Record<string, unknown>): Promise<string> {
    this.logger.log(`Generating image with Flux model, prompt: ${prompt.substring(0, 50)}...`);
    // TODO: 实现 Replicate / Flux API 调用
    // 1. 提交预测任务
    // 2. 轮询等待结果
    // 3. 返回图片 URL
    const response = await axios.post(
      `${this.baseUrl}/predictions`,
      {
        version: this.model,
        input: {
          prompt,
          width: options?.width ?? 1024,
          height: options?.height ?? 576,
          num_outputs: 1,
          ...options,
        },
      },
      {
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    // TODO: 轮询 response.data.urls.get 直到 status === 'succeeded'
    return response.data.output?.[0] ?? '';
  }
}

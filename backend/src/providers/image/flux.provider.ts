import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ImageProvider } from './image.provider';

/** 宽高比 → OpenAI 图片尺寸映射 */
const ASPECT_RATIO_SIZE: Record<string, string> = {
  '9:16': '1024x1536', // 竖屏（短视频/TikTok）
  '16:9': '1536x1024', // 横屏
  '1:1': '1024x1024',  // 方图
};

@Injectable()
export class FluxImageProvider extends ImageProvider {
  private readonly logger = new Logger(FluxImageProvider.name);
  private readonly http: AxiosInstance;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('IMAGE_API_KEY') ?? '';
    const baseURL =
      this.configService.get<string>('IMAGE_API_BASE_URL') ?? 'https://api.openai.com/v1';
    this.model = this.configService.get<string>('IMAGE_MODEL') ?? 'gpt-image-1';

    this.http = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120_000,
    });
  }

  /**
   * 调用 OpenAI gpt-image-1/2 生成图片
   * @param prompt  英文生图 prompt
   * @param options { aspect_ratio?: '9:16'|'16:9'|'1:1', quality?: 'low'|'medium'|'high' }
   * @returns 图片 URL（优先）或 base64 data URL（备用）
   */
  async generateImage(prompt: string, options?: Record<string, unknown>): Promise<string> {
    const aspectRatio = (options?.aspect_ratio as string) ?? '9:16';
    const size = ASPECT_RATIO_SIZE[aspectRatio] ?? '1024x1536';
    const quality = (options?.quality as string) ?? 'medium';

    this.logger.log(
      `[generateImage] model=${this.model} size=${size} quality=${quality} prompt="${prompt.slice(0, 60)}..."`,
    );

    const body: Record<string, unknown> = {
      model: this.model,
      prompt,
      n: 1,
      size,
      quality,
    };

    let resp: Awaited<ReturnType<typeof this.http.post<{ data: Array<{ url?: string; b64_json?: string }> }>>>;
    try {
      resp = await this.http.post<{ data: Array<{ url?: string; b64_json?: string }> }>('/images/generations', body);
    } catch (err: any) {
      // 把 OpenAI 返回的 error body 打出来，方便调试
      const detail = err?.response?.data?.error ?? err?.message ?? String(err);
      this.logger.error(`[generateImage] API error: ${JSON.stringify(detail)}`);
      throw new Error(
        typeof detail === 'object' ? (detail.message ?? JSON.stringify(detail)) : detail,
      );
    }

    const item = resp.data?.data?.[0];

    if (!item) {
      throw new Error(`[FluxImageProvider] Empty response from ${this.model}`);
    }

    // gpt-image-1 默认返回 b64_json；如果接口支持 url 则直接用
    if (item.url) {
      this.logger.log(`[generateImage] got URL: ${item.url.slice(0, 60)}...`);
      return item.url as string;
    }

    if (item.b64_json) {
      // 转成 data URL，后续可换成上传 COS
      const dataUrl = `data:image/png;base64,${item.b64_json as string}`;
      this.logger.log(`[generateImage] got b64_json (len=${(item.b64_json as string).length}), returning data URL`);
      return dataUrl;
    }

    throw new Error(`[FluxImageProvider] Response has neither url nor b64_json`);
  }
}

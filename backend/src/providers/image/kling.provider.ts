import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { ImageProvider } from './image.provider';

/** 宽高比 → 可灵 API 参数（直接透传） */
const SUPPORTED_RATIOS = new Set(['16:9', '9:16', '1:1', '4:3', '3:4', '2:3', '3:2']);

/** 任务状态轮询间隔（ms） */
const POLL_INTERVAL = 3_000;
/** 最长等待时间（ms） */
const POLL_TIMEOUT = 180_000;

@Injectable()
export class KlingImageProvider extends ImageProvider {
  private readonly logger = new Logger(KlingImageProvider.name);
  private readonly http: AxiosInstance;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.accessKey = this.configService.get<string>('KLING_ACCESS_KEY') ?? '';
    this.secretKey = this.configService.get<string>('KLING_SECRET_KEY') ?? '';
    this.model = this.configService.get<string>('KLING_MODEL') ?? 'kling-v1-5';

    this.http = axios.create({
      baseURL: 'https://api.klingai.com',
      timeout: 30_000, // 单次请求超时，轮询循环另外控制
    });
  }

  // -------------------------------------------------------------------
  // JWT 鉴权（HS256，无需额外依赖）
  // -------------------------------------------------------------------
  private buildToken(): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');

    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        iss: this.accessKey,
        exp: now + 1800, // 30 分钟有效
        nbf: now - 5,
      }),
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  // -------------------------------------------------------------------
  // 提交生图任务
  // -------------------------------------------------------------------
  private async submitTask(
    prompt: string,
    negativePrompt: string,
    aspectRatio: string,
    referenceImageUrl?: string,
    imageFidelity?: number,
  ): Promise<string> {
    if (!this.accessKey || !this.secretKey) {
      throw new Error('缺少 KLING_ACCESS_KEY 或 KLING_SECRET_KEY，无法生成分镜图片');
    }

    const token = this.buildToken();

    // i2i 模式下不允许同时使用 negative_prompt（Kling 限制）
    const useReference = !!referenceImageUrl;
    const body: Record<string, unknown> = {
      model_name: this.model,
      prompt,
      n: 1,
      aspect_ratio: aspectRatio,
    };
    if (useReference) {
      body.image = referenceImageUrl;
      body.image_reference = 'subject'; // 锚定主体（角色）
      body.image_fidelity = typeof imageFidelity === 'number' ? imageFidelity : 0.5;
    } else if (negativePrompt) {
      body.negative_prompt = negativePrompt;
    }

    let resp: Awaited<ReturnType<typeof this.http.post<KlingCreateResponse>>>;
    try {
      resp = await this.http.post<KlingCreateResponse>(
        '/v1/images/generations',
        body,
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err: any) {
      const detail = err?.response?.data ?? err?.message ?? String(err);
      this.logger.error(`[submitTask] error: ${JSON.stringify(detail)}`);
      throw new Error(
        typeof detail === 'object'
          ? (detail.message ?? JSON.stringify(detail))
          : detail,
      );
    }

    const respBody = resp.data;
    if (respBody.code !== 0) {
      throw new Error(`Kling API error ${respBody.code}: ${respBody.message}`);
    }

    const taskId = respBody.data?.task_id;
    if (!taskId) throw new Error('Kling returned no task_id');
    return taskId;
  }

  // -------------------------------------------------------------------
  // 轮询任务结果
  // -------------------------------------------------------------------
  private async pollTask(taskId: string): Promise<string> {
    const deadline = Date.now() + POLL_TIMEOUT;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));

      const token = this.buildToken();
      let resp: Awaited<ReturnType<typeof this.http.get<KlingQueryResponse>>>;
      try {
        resp = await this.http.get<KlingQueryResponse>(
          `/v1/images/generations/${taskId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (err: any) {
        this.logger.warn(`[pollTask:${taskId}] poll request failed, retrying...`);
        continue;
      }

      const body = resp.data;
      if (body.code !== 0) {
        throw new Error(`Kling poll error ${body.code}: ${body.message}`);
      }

      const status = body.data?.task_status;
      this.logger.log(`[pollTask:${taskId}] status=${status}`);

      if (status === 'succeed') {
        const images = body.data?.task_result?.images ?? [];
        const url = images[0]?.url;
        if (!url) throw new Error('Kling task succeeded but no image URL');
        return url;
      }

      if (status === 'failed') {
        const reason = body.data?.task_status_msg ?? 'unknown';
        throw new Error(`Kling task failed: ${reason}`);
      }

      // status: 'submitted' | 'processing' — 继续等
    }

    throw new Error(`Kling task ${taskId} timed out after ${POLL_TIMEOUT / 1000}s`);
  }

  // -------------------------------------------------------------------
  // 主入口
  // -------------------------------------------------------------------
  async generateImage(prompt: string, options?: Record<string, unknown>): Promise<string> {
    const aspectRatio = SUPPORTED_RATIOS.has(options?.aspect_ratio as string)
      ? (options!.aspect_ratio as string)
      : '9:16';
    const negativePrompt =
      (options?.negative_prompt as string) ??
      'modern clothing, phone, car, text, watermark, extra fingers, distorted face, low quality, blurry, nsfw';

    const referenceImageUrl =
      typeof options?.referenceImageUrl === 'string' && options.referenceImageUrl.length > 0
        ? (options.referenceImageUrl as string)
        : undefined;
    const referenceStrength =
      typeof options?.referenceStrength === 'number'
        ? (options.referenceStrength as number)
        : undefined;

    this.logger.log(
      `[generateImage] model=${this.model} ratio=${aspectRatio} ref=${referenceImageUrl ? 'yes' : 'no'} prompt="${prompt.slice(0, 60)}..."`,
    );

    const taskId = await this.submitTask(
      prompt,
      negativePrompt,
      aspectRatio,
      referenceImageUrl,
      referenceStrength,
    );
    this.logger.log(`[generateImage] task submitted: ${taskId}`);

    const imageUrl = await this.pollTask(taskId);
    this.logger.log(`[generateImage] done: ${imageUrl.slice(0, 60)}...`);
    return imageUrl;
  }
}

// -------------------------------------------------------------------
// 响应类型
// -------------------------------------------------------------------
interface KlingCreateResponse {
  code: number;
  message: string;
  data?: {
    task_id: string;
    task_status: string;
  };
}

interface KlingQueryResponse {
  code: number;
  message: string;
  data?: {
    task_id: string;
    task_status: 'submitted' | 'processing' | 'succeed' | 'failed';
    task_status_msg?: string;
    task_result?: {
      images?: Array<{ index: number; url: string }>;
    };
  };
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { TTSProvider } from './tts.provider';

@Injectable()
export class SiliconFlowTTSProvider extends TTSProvider {
  private readonly logger = new Logger(SiliconFlowTTSProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly voice: string;
  private readonly responseFormat: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.apiKey =
      this.configService.get<string>('SILICONFLOW_API_KEY') ??
      this.configService.get<string>('TTS_API_KEY') ??
      '';
    this.baseUrl =
      this.configService.get<string>('TTS_BASE_URL') ??
      this.configService.get<string>('SILICONFLOW_BASE_URL') ??
      'https://api.siliconflow.cn/v1';
    this.model = this.configService.get<string>('TTS_MODEL') ?? 'fnlp/MOSS-TTSD-v0.5';
    this.voice = this.configService.get<string>('TTS_VOICE') ?? 'fnlp/MOSS-TTSD-v0.5:alex';
    this.responseFormat = this.configService.get<string>('TTS_RESPONSE_FORMAT') ?? 'mp3';
    this.publicBaseUrl =
      this.configService.get<string>('PUBLIC_BASE_URL') ??
      `http://127.0.0.1:${this.configService.get<string>('PORT') ?? '3010'}`;
  }

  async generateVoice(text: string, options?: Record<string, unknown>): Promise<string> {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw new Error('TTS 文本为空，无法生成配音');
    }
    if (!this.apiKey) {
      throw new Error('TTS 未配置：缺少 TTS_API_KEY 或 SILICONFLOW_API_KEY，无法生成配音');
    }

    const model = this.getStringOption(options, 'model', this.model);
    const voice = this.getStringOption(options, 'voice', this.voice);
    const responseFormat = this.getStringOption(options, 'responseFormat', this.responseFormat);
    const stream = typeof options?.stream === 'boolean' ? options.stream : true;

    this.logger.log(`Generating SiliconFlow TTS audio: ${normalizedText.substring(0, 30)}...`);

    const response = await axios.post<ArrayBuffer>(
      `${this.baseUrl.replace(/\/$/, '')}/audio/speech`,
      {
        model,
        input: normalizedText,
        voice,
        response_format: responseFormat,
        stream,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 120000,
        validateStatus: () => true,
      },
    );

    if (response.status < 200 || response.status >= 300) {
      const errorText = Buffer.from(response.data).toString('utf8');
      throw new Error(`SiliconFlow TTS 生成失败 (${response.status}): ${errorText.slice(0, 500)}`);
    }

    const buffer = Buffer.from(response.data);
    if (buffer.length === 0) {
      throw new Error('SiliconFlow TTS 返回了空音频');
    }

    const extension = this.getAudioExtension(responseFormat);
    const audioDir = join(process.cwd(), 'public', 'audio');
    const fileName = `tts-${Date.now()}-${randomUUID()}${extension}`;
    await mkdir(audioDir, { recursive: true });
    await writeFile(join(audioDir, fileName), buffer);

    return `${this.publicBaseUrl.replace(/\/$/, '')}/public/audio/${fileName}`;
  }

  private getStringOption(options: Record<string, unknown> | undefined, key: string, fallback: string): string {
    const value = options?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private getAudioExtension(responseFormat: string): string {
    const normalized = responseFormat.trim().toLowerCase();
    if (!normalized) return '.mp3';
    if (normalized.startsWith('.')) return normalized;
    const parsed = extname(`audio.${normalized}`);
    return parsed || '.mp3';
  }
}

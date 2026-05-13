export const TTS_PROVIDER_TOKEN = 'TTS_PROVIDER';

export abstract class TTSProvider {
  /**
   * 将文本转换为语音，返回音频 URL
   */
  abstract generateVoice(text: string, options?: Record<string, unknown>): Promise<string>;
}

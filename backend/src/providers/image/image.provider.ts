export const IMAGE_PROVIDER_TOKEN = 'IMAGE_PROVIDER';

export abstract class ImageProvider {
  /**
   * 根据提示词生成图片，返回图片 URL
   */
  abstract generateImage(prompt: string, options?: Record<string, unknown>): Promise<string>;
}

export declare const IMAGE_PROVIDER_TOKEN = "IMAGE_PROVIDER";
export declare abstract class ImageProvider {
    abstract generateImage(prompt: string, options?: Record<string, unknown>): Promise<string>;
}

export declare const TTS_PROVIDER_TOKEN = "TTS_PROVIDER";
export declare abstract class TTSProvider {
    abstract generateVoice(text: string, options?: Record<string, unknown>): Promise<string>;
}

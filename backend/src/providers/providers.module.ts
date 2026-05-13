import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLM_PROVIDER_TOKEN } from './llm/llm.provider';
import { BigModelProvider } from './llm/bigmodel.provider';
import { ImageProvider, IMAGE_PROVIDER_TOKEN } from './image/image.provider';
import { FluxImageProvider } from './image/flux.provider';
import { TTS_PROVIDER_TOKEN } from './tts/tts.provider';
import { VolcanoTTSProvider } from './tts/volcano.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LLM_PROVIDER_TOKEN,
      useClass: BigModelProvider,
    },
    {
      provide: IMAGE_PROVIDER_TOKEN,
      useClass: FluxImageProvider,
    },
    {
      provide: TTS_PROVIDER_TOKEN,
      useClass: VolcanoTTSProvider,
    },
  ],
  exports: [LLM_PROVIDER_TOKEN, IMAGE_PROVIDER_TOKEN, TTS_PROVIDER_TOKEN],
})
export class ProvidersModule {}

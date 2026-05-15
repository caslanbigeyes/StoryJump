import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLM_PROVIDER_TOKEN } from './llm/llm.provider';
import { BigModelProvider } from './llm/bigmodel.provider';
import { IMAGE_PROVIDER_TOKEN } from './image/image.provider';
import { KlingImageProvider } from './image/kling.provider';
import { TTS_PROVIDER_TOKEN } from './tts/tts.provider';
import { SiliconFlowTTSProvider } from './tts/siliconflow.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LLM_PROVIDER_TOKEN,
      useClass: BigModelProvider,
    },
    {
      provide: IMAGE_PROVIDER_TOKEN,
      useClass: KlingImageProvider,
    },
    {
      provide: TTS_PROVIDER_TOKEN,
      useClass: SiliconFlowTTSProvider,
    },
  ],
  exports: [LLM_PROVIDER_TOKEN, IMAGE_PROVIDER_TOKEN, TTS_PROVIDER_TOKEN],
})
export class ProvidersModule {}

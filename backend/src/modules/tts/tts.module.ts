import { Module } from '@nestjs/common';
import { TtsService } from './tts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VolcanoTTSProvider } from '../../providers/tts/volcano.provider';
import { TTSProvider } from '../../providers/tts/tts.provider';

@Module({
  providers: [
    TtsService,
    PrismaService,
    {
      provide: TTSProvider,
      useClass: VolcanoTTSProvider,
    },
  ],
  exports: [TtsService],
})
export class TtsModule {}

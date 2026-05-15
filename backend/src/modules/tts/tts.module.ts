import { Module } from '@nestjs/common';
import { TtsService } from './tts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SiliconFlowTTSProvider } from '../../providers/tts/siliconflow.provider';
import { TTSProvider } from '../../providers/tts/tts.provider';

@Module({
  providers: [
    TtsService,
    PrismaService,
    {
      provide: TTSProvider,
      useClass: SiliconFlowTTSProvider,
    },
  ],
  exports: [TtsService],
})
export class TtsModule {}

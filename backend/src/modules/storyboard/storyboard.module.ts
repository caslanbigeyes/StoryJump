import { Module } from '@nestjs/common';
import { StoryboardService } from './storyboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProvidersModule } from '../../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [StoryboardService, PrismaService],
  exports: [StoryboardService],
})
export class StoryboardModule {}

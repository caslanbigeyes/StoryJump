import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VideoService } from './video.service';

@Module({
  providers: [VideoService, PrismaService],
  exports: [VideoService],
})
export class VideoModule {}

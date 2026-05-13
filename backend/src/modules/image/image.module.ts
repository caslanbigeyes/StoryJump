import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FluxImageProvider } from '../../providers/image/flux.provider';
import { ImageProvider } from '../../providers/image/image.provider';

@Module({
  providers: [
    ImageService,
    PrismaService,
    {
      provide: ImageProvider,
      useClass: FluxImageProvider,
    },
  ],
  exports: [ImageService],
})
export class ImageModule {}

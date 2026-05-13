import { Module } from '@nestjs/common';
import { ScriptService } from './script.service';
import { ProvidersModule } from '../../providers/providers.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [ProvidersModule],
  providers: [ScriptService, PrismaService],
  exports: [ScriptService],
})
export class ScriptModule {}

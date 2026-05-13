import { Module } from '@nestjs/common';
import { ScriptService } from './script.service';
import { ProvidersModule } from '../../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [ScriptService],
  exports: [ScriptService],
})
export class ScriptModule {}

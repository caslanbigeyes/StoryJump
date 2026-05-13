import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaService } from './prisma/prisma.service';
import { ProvidersModule } from './providers/providers.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TaskModule } from './modules/task/task.module';
import { ScriptModule } from './modules/script/script.module';
import { StoryboardModule } from './modules/storyboard/storyboard.module';
import { ImageModule } from './modules/image/image.module';
import { TtsModule } from './modules/tts/tts.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const url = new URL(redisUrl);
        return {
          redis: {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
          },
        };
      },
      inject: [ConfigService],
    }),
    ProvidersModule,
    AuthModule,
    UserModule,
    TaskModule,
    ScriptModule,
    StoryboardModule,
    ImageModule,
    TtsModule,
    StorageModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}

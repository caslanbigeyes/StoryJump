import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';
import * as fs from 'fs';
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

// 构造 .env 文件的所有可能路径
const envPaths = [
  join(process.cwd(), '.env'),
  join(process.cwd(), 'backend', '.env'),
  join(__dirname, '../.env'),
  join(__dirname, '../../.env'),
  '.env',
].filter(p => fs.existsSync(p));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envPaths.length > 0 ? envPaths : ['.env'],
    }),
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

import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TaskService, CreateTaskDto } from './task.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScriptService } from '../script/script.service';
import { StoryboardService } from '../storyboard/storyboard.service';
import { ImageService } from '../image/image.service';
import { TtsService } from '../tts/tts.service';
import { VideoService } from '../video/video.service';
import type { StoryScript } from '../../providers/llm/llm.provider';

interface RewriteScriptDto {
  instructions?: string;
}

interface UpdateShotDto {
  sceneText?: string;
  cameraAngle?: string;
  characterAction?: string;
  imagePrompt?: string;
}

interface ExportVideoDto {
  resolution?: string;
  format?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly scriptService: ScriptService,
    private readonly storyboardService: StoryboardService,
    private readonly imageService: ImageService,
    private readonly ttsService: TtsService,
    private readonly videoService: VideoService,
  ) {}

  /**
   * POST /api/tasks
   * 创建任务 → 加入队列 → 返回 taskId
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Req() req: any, @Body() dto: CreateTaskDto) {
    const userId = req.user?.id as string;
    return this.taskService.createTask(userId, dto);
  }

  /**
   * GET /api/tasks
   * 任务列表（分页）
   */
  @Get()
  async listTasks(@Req() req: any, @Query() pagination: PaginationDto) {
    const userId = req.user?.id as string;
    return this.taskService.listTasks(userId, pagination);
  }

  /**
   * GET /api/tasks/:id
   * 任务详情 + 分镜列表
   */
  @Get(':id')
  async getTask(@Param('id') id: string) {
    return this.taskService.getTaskById(id);
  }

  /**
   * GET /api/tasks/:id/status
   * 轮询用：status / currentStep / progress / errorMessage
   */
  @Get(':id/status')
  async getTaskStatus(@Param('id') id: string) {
    return this.taskService.getTaskStatus(id);
  }

  /**
   * GET /api/tasks/:id/shots
   * 分镜列表
   */
  @Get(':id/shots')
  async getTaskShots(@Param('id') id: string) {
    return this.taskService.getTaskShots(id);
  }

  /**
   * GET /api/tasks/:id/result
   * 完整分镜输出（StoryboardOutput）
   * 仅在 status=success 后有数据
   */
  @Get(':id/result')
  async getTaskResult(@Param('id') id: string) {
    return this.taskService.getTaskResult(id);
  }

  @Patch(':id/script')
  async updateTaskScript(@Param('id') id: string, @Body() script: StoryScript) {
    return this.scriptService.updateTaskScript(id, script);
  }

  @Post(':id/script/rewrite')
  async rewriteTaskScript(@Param('id') id: string, @Body() dto: RewriteScriptDto) {
    return this.scriptService.rewriteTaskScript(id, dto.instructions);
  }

  @Post(':id/storyboard/resplit')
  async resplitTaskStoryboard(@Param('id') id: string) {
    return this.storyboardService.resplitTaskShots(id);
  }

  @Patch('shots/:shotId')
  async updateShot(@Param('shotId') shotId: string, @Body() dto: UpdateShotDto) {
    return this.storyboardService.updateShot(shotId, dto);
  }

  @Post('shots/:shotId/regenerate-image')
  async regenerateShotImage(@Param('shotId') shotId: string) {
    const imageUrl = await this.imageService.regenerateImage(shotId);
    return { imageUrl };
  }

  @Post(':id/images/regenerate')
  async regenerateTaskImages(@Param('id') id: string) {
    return this.imageService.generateImagesForTask(id);
  }

  @Post('shots/:shotId/regenerate-audio')
  async regenerateShotAudio(@Param('shotId') shotId: string) {
    const audioUrl = await this.ttsService.regenerateAudio(shotId);
    return { audioUrl };
  }

  @Post(':id/audio/regenerate')
  async regenerateTaskAudio(@Param('id') id: string) {
    return this.ttsService.generateAudioForTask(id);
  }

  @Get(':id/video')
  async getTaskVideo(@Param('id') id: string) {
    return this.videoService.getTaskVideo(id);
  }

  @Post(':id/video/export')
  async exportTaskVideo(@Param('id') id: string, @Body() dto: ExportVideoDto) {
    return this.videoService.startTaskVideoExport(id, dto);
  }
}

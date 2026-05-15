import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStatus, TaskStep } from '../../common/enums/task-status.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { STORY_PIPELINE_QUEUE } from '../../workers/pipeline.worker';
import { TaskInput, StoryboardOutput } from '../../providers/llm/llm.provider';

// --------------------------------------------------------
// DTO：对应 skills.md 输入字段
// --------------------------------------------------------
export class MainCharacterDto {
  @IsString() name: string;
  @IsNumber() age: number;
  @IsString() gender: string;
  @IsString() appearance: string;
  @IsString() personality: string;
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  topic: string;

  @IsOptional() @IsString()
  genre?: string;

  @IsOptional() @IsString()
  era?: string;

  @IsOptional() @IsString()
  location?: string;

  @IsOptional() @IsString()
  tone?: string;

  @IsOptional() @IsNumber() @Min(15) @Max(600)
  target_duration?: number;

  @IsOptional() @IsNumber() @Min(5) @Max(100)
  shot_count?: number;

  @IsOptional() @IsString()
  aspect_ratio?: string;

  @IsOptional() @IsString()
  language?: string;

  @IsOptional() @IsString()
  visual_style?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MainCharacterDto)
  main_characters?: MainCharacterDto[];
}

// --------------------------------------------------------
// Service
// --------------------------------------------------------
@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(STORY_PIPELINE_QUEUE) private readonly pipelineQueue: Queue,
  ) {}

  async createTask(userId: string, dto: CreateTaskDto) {
    // 将 DTO 规范化为 TaskInput（填充 skills.md 默认值）
    const input: TaskInput = {
      title: dto.title,
      topic: dto.topic,
      genre: dto.genre ?? 'general',
      era: dto.era ?? 'contemporary',
      location: dto.location ?? 'unspecified',
      tone: dto.tone ?? '温暖、真实',
      target_duration: dto.target_duration ?? 120,
      shot_count: dto.shot_count ?? 20,
      aspect_ratio: dto.aspect_ratio ?? '9:16',
      language: dto.language ?? 'zh-CN',
      visual_style: dto.visual_style ?? 'cinematic realism',
      main_characters: dto.main_characters ?? [],
    };

    const task = await this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        status: TaskStatus.PENDING,
        currentStep: TaskStep.CREATE_SCRIPT,
        progress: 0,
        inputJson: JSON.stringify(input),
      },
    });

    // 加入队列（重试 3 次，指数退避）
    await this.pipelineQueue.add(
      TaskStep.CREATE_SCRIPT,
      { taskId: task.id, input },
      { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
    );

    return {
      taskId: task.id,
      status: task.status,
      currentStep: task.currentStep,
    };
  }

  async listTasks(userId: string, pagination: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        select: {
          id: true,
          title: true,
          status: true,
          currentStep: true,
          progress: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.task.count({ where: { userId } }),
    ]);
    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async getTaskById(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { shots: { orderBy: { shotIndex: 'asc' } } },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return task;
  }

  async getTaskStatus(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        status: true,
        currentStep: true,
        progress: true,
        errorMessage: true,
      },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return task;
  }

  async getTaskShots(taskId: string) {
    return this.prisma.shot.findMany({
      where: { taskId },
      orderBy: { shotIndex: 'asc' },
    });
  }

  /** 重试：读取原始 inputJson，创建新任务 */
  async retryTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { inputJson: true },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    if (!task.inputJson) throw new NotFoundException(`Task ${taskId} has no input data to retry`);

    const input = JSON.parse(task.inputJson) as TaskInput;
    return this.createTask(userId, input as unknown as CreateTaskDto);
  }

  /** 返回完整分镜结果（解析 outputJson） */
  async getTaskResult(taskId: string): Promise<StoryboardOutput | null> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true, outputJson: true, errorMessage: true },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    if (!task.outputJson) return null;
    return JSON.parse(task.outputJson) as StoryboardOutput;
  }
}

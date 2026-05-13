import {
  Body,
  Controller,
  Get,
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

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

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
}

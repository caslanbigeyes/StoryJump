import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, TaskInput } from '../../providers/llm/llm.provider';
import { TaskStatus, TaskStep } from '../../common/enums/task-status.enum';
import { STORY_PIPELINE_QUEUE } from '../pipeline.worker';

export interface CreateScriptJobData {
  taskId: string;
  input: TaskInput;
}

export async function handleCreateScriptJob(
  job: Job<CreateScriptJobData>,
  prisma: PrismaService,
  llmProvider: LLMProvider,
): Promise<void> {
  const logger = new Logger('CreateScriptJob');
  const { taskId, input } = job.data;
  logger.log(`[task:${taskId}] start create-script`);

  await prisma.task.update({
    where: { id: taskId },
    data: { status: TaskStatus.RUNNING, currentStep: TaskStep.CREATE_SCRIPT, progress: 5 },
  });

  try {
    // 调用 LLM 一次性生成完整分镜输出（含剧本+分镜+prompt）
    const output = await llmProvider.generateStoryboard(input);

    // 持久化：outputJson 存完整结果，shots 写入 Shot 表
    await prisma.task.update({
      where: { id: taskId },
      data: {
        outputJson: JSON.stringify(output),
        currentStep: TaskStep.GENERATE_IMAGES,
        progress: 60,
      },
    });

    // 批量写入 Shot 记录
    if (output.shots?.length) {
      await prisma.shot.createMany({
        data: output.shots.map((shot) => ({
          taskId,
          shotIndex: shot.shot_id,
          sceneText: shot.action,
          cameraAngle: `${shot.camera.shot_size}, ${shot.camera.angle}, ${shot.camera.movement}`,
          characterAction: shot.action,
          imagePrompt: shot.image_prompt,
          status: 'pending',
        })),
      });
    }

    // 标记任务完成
    await prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.SUCCESS, currentStep: TaskStep.DONE, progress: 100 },
    });

    await job.updateProgress(100);
    logger.log(`[task:${taskId}] create-script done, shots=${output.shots?.length}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`[task:${taskId}] create-script failed: ${msg}`);
    await prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.FAILED, errorMessage: msg },
    });
    throw error;
  }
}

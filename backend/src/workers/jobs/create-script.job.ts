import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, TaskInput } from '../../providers/llm/llm.provider';
import { TaskStatus, TaskStep } from '../../common/enums/task-status.enum';

export interface CreateScriptJobData {
  taskId: string;
  input: TaskInput;
}

export async function handleCreateScriptJob(
  job: Job<CreateScriptJobData>,
  prisma: PrismaService,
  llmProvider: LLMProvider,
  queue: Queue,
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

    // 持久化：outputJson 存完整结果
    await prisma.task.update({
      where: { id: taskId },
      data: {
        outputJson: JSON.stringify(output),
        currentStep: TaskStep.GENERATE_IMAGES,
        progress: 60,
      },
    });

    // 批量写入 Beat 和 Shot（先删已有的，防止重试时重复）
    await prisma.shot.deleteMany({ where: { taskId } });
    await prisma.beat.deleteMany({ where: { taskId } });

    // 持久化 Beat 记录（从 outputJson 里的 beats 数组）
    const beatIdMap = new Map<number, string>(); // beat_id → db Beat.id
    if (output.beats?.length) {
      for (const beat of output.beats) {
        const dbBeat = await prisma.beat.create({
          data: {
            taskId,
            beatIndex: beat.beat_id,
            goal: beat.goal,
            event: beat.event,
            emotion: beat.emotion,
            duration: beat.duration,
            narration: beat.narration,
            shotCount: beat.shot_count,
          },
        });
        beatIdMap.set(beat.beat_id, dbBeat.id);
      }
    }

    // 持久化 Shot 记录
    if (output.shots?.length) {
      await prisma.shot.createMany({
        data: output.shots.map((shot) => ({
          taskId,
          beatId: shot.beat_id ? (beatIdMap.get(shot.beat_id) ?? null) : null,
          shotIndex: shot.shot_id,
          sceneText: shot.narration || shot.action,
          cameraAngle: [shot.shot_type, shot.camera.shot_size, shot.camera.angle, shot.camera.movement]
            .filter(Boolean)
            .join(', '),
          characterAction: shot.action,
          actionVerb: (shot as any).actionVerb ?? null,
          imagePrompt: shot.image_prompt,
          status: 'pending',
        })),
      });
    }

    await job.updateProgress(60);
    logger.log(`[task:${taskId}] create-script done, shots=${output.shots?.length}, enqueueing generate_images`);

    // 入队生图任务（传入 aspect_ratio 供图片尺寸映射）
    await queue.add(
      TaskStep.GENERATE_IMAGES,
      {
        taskId,
        options: {
          aspect_ratio: input.aspect_ratio ?? '9:16',
          quality: 'medium',
        },
      },
      { attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
    );
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

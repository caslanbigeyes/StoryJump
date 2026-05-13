import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider } from '../../providers/llm/llm.provider';
import { TaskStep } from '../../common/enums/task-status.enum';

export interface GeneratePromptsJobData {
  taskId: string;
}

/**
 * NOTE: In the current MVP flow, image_prompts are already generated inside
 * create-script.job.ts (via generateStoryboard). This job handles re-generation
 * if needed in future flows.
 */
export async function handleGeneratePromptsJob(
  job: Job<GeneratePromptsJobData>,
  prisma: PrismaService,
  llmProvider: LLMProvider,
): Promise<void> {
  const logger = new Logger('GeneratePromptsJob');
  const { taskId } = job.data;
  logger.log(`[task:${taskId}] generate-prompts`);

  await prisma.task.update({
    where: { id: taskId },
    data: { currentStep: TaskStep.GENERATE_PROMPTS, progress: 40 },
  });

  // Re-generate prompts for shots that don't have one yet
  const shots = await prisma.shot.findMany({
    where: { taskId, imagePrompt: null },
    orderBy: { shotIndex: 'asc' },
  });

  if (shots.length === 0) {
    logger.log(`[task:${taskId}] all shots already have prompts, skipping`);
    await job.updateProgress(100);
    return;
  }

  // Build ShotData array for re-generation
  const shotDataList = shots.map((s, i) => ({
    shot_id: s.shotIndex,
    duration: 4,
    scene: s.sceneText ?? '',
    time: '',
    location: '',
    character: [],
    action: s.characterAction ?? '',
    emotion: '',
    camera: { shot_size: '', angle: s.cameraAngle ?? '', movement: '' },
    visual: { lighting: '', color_palette: '', composition: '' },
    narration: '',
    image_prompt: '',
    negative_prompt: '',
  }));

  const results = await llmProvider.generateImagePrompts(shotDataList, [], {
    title: '',
    genre: '',
    duration: 0,
    shot_count: shots.length,
    aspect_ratio: '9:16',
    visual_style: '',
  });

  for (const result of results) {
    const shot = shots.find((s) => s.shotIndex === result.shot_id);
    if (shot) {
      await prisma.shot.update({
        where: { id: shot.id },
        data: { imagePrompt: result.image_prompt },
      });
    }
  }

  logger.log(`[task:${taskId}] re-generated ${results.length} prompts`);
  await job.updateProgress(100);
}

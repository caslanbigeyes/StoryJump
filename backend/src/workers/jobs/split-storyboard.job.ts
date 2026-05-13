import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider } from '../../providers/llm/llm.provider';
import { TaskStep } from '../../common/enums/task-status.enum';

export interface SplitStoryboardJobData {
  taskId: string;
}

/**
 * NOTE: In the current MVP flow, create-script.job.ts handles the full pipeline
 * (generateStoryboard = script + shots + prompts in one call).
 * This job is kept as a no-op placeholder for future manual re-split flows.
 */
export async function handleSplitStoryboardJob(
  job: Job<SplitStoryboardJobData>,
  prisma: PrismaService,
  _llmProvider: LLMProvider,
): Promise<void> {
  const logger = new Logger('SplitStoryboardJob');
  const { taskId } = job.data;
  logger.log(`[task:${taskId}] split-storyboard (no-op in MVP, shots already created)`);

  await prisma.task.update({
    where: { id: taskId },
    data: { currentStep: TaskStep.SPLIT_STORYBOARD, progress: 20 },
  });

  await job.updateProgress(100);
}

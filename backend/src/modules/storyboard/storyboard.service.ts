import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, LLM_PROVIDER_TOKEN, ShotData, StoryScript, StoryboardOutput, TaskInput } from '../../providers/llm/llm.provider';

@Injectable()
export class StoryboardService {
  private readonly logger = new Logger(StoryboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: LLMProvider,
  ) {}

  async splitIntoShots(taskId: string, script: StoryScript, input: TaskInput): Promise<ShotData[]> {
    this.logger.log(`Splitting script into shots for task ${taskId}`);
    return this.llmProvider.splitStoryboard(script, input);
  }

  async resplitTaskShots(taskId: string): Promise<StoryboardOutput> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        inputJson: true,
        outputJson: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    if (!task.inputJson || !task.outputJson) {
      throw new NotFoundException(`Task ${taskId} script or input not found`);
    }

    const input = JSON.parse(task.inputJson) as TaskInput;
    const output = JSON.parse(task.outputJson) as StoryboardOutput;
    const shots = await this.llmProvider.splitStoryboard(output.script, input, output.character_bible ?? []);
    const meta: StoryboardOutput['meta'] = {
      ...output.meta,
      shot_count: shots.length,
      style_token:
        output.meta.style_token ||
        [input.visual_style, 'cinematic realism', 'Honor of Kings cinematic style', input.aspect_ratio]
          .filter(Boolean)
          .join(', '),
      scene_context: output.meta.scene_context || {
        location: input.location,
        era: input.era,
        tone: input.tone,
        aspect_ratio: input.aspect_ratio,
      },
    };
    const prompts = await this.llmProvider.generateImagePrompts(shots, output.character_bible ?? [], meta);
    const promptByShotId = new Map(prompts.map((prompt) => [prompt.shot_id, prompt]));
    const shotsWithPrompts = shots.map((shot) => {
      const prompt = promptByShotId.get(shot.shot_id);
      return {
        ...shot,
        image_prompt: prompt?.image_prompt || shot.image_prompt,
        negative_prompt: prompt?.negative_prompt || shot.negative_prompt,
      };
    });

    const nextOutput: StoryboardOutput = {
      ...output,
      shots: shotsWithPrompts,
      meta,
      validation: {
        ...output.validation,
        shot_count_match: shotsWithPrompts.length === input.shot_count,
        all_prompts_ready: shotsWithPrompts.every((shot) => Boolean(shot.image_prompt)),
      },
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.shot.deleteMany({ where: { taskId } });

      if (shotsWithPrompts.length > 0) {
        await tx.shot.createMany({
          data: shotsWithPrompts.map((shot) => ({
            taskId,
            shotIndex: shot.shot_id,
            sceneText: shot.scene,
            cameraAngle: [shot.shot_type, shot.camera.shot_size, shot.camera.angle, shot.camera.movement]
              .filter(Boolean)
              .join(', '),
            characterAction: shot.action,
            imagePrompt: shot.image_prompt,
            imageUrl: null,
            audioUrl: null,
            status: 'pending',
          })),
        });
      }

      await tx.task.update({
        where: { id: taskId },
        data: {
          outputJson: JSON.stringify(nextOutput),
          currentStep: 'done',
          progress: 100,
        },
      });
    });

    return nextOutput;
  }

  async updateShot(
    shotId: string,
    data: Partial<{ sceneText: string; cameraAngle: string; characterAction: string; imagePrompt: string }>,
  ) {
    const shot = await this.prisma.shot.update({
      where: { id: shotId },
      data,
    });

    const task = await this.prisma.task.findUnique({
      where: { id: shot.taskId },
      select: { outputJson: true },
    });

    if (task?.outputJson) {
      const output = JSON.parse(task.outputJson) as StoryboardOutput;
      const nextShots = output.shots.map((item) => {
        if (item.shot_id !== shot.shotIndex) return item;
        return {
          ...item,
          scene: data.sceneText ?? item.scene,
          action: data.characterAction ?? item.action,
          image_prompt: data.imagePrompt ?? item.image_prompt,
          camera: data.cameraAngle
            ? { ...item.camera, angle: data.cameraAngle }
            : item.camera,
        };
      });

      await this.prisma.task.update({
        where: { id: shot.taskId },
        data: {
          outputJson: JSON.stringify({ ...output, shots: nextShots }),
        },
      });
    }

    return shot;
  }

  async getShotsByTask(taskId: string) {
    return this.prisma.shot.findMany({ where: { taskId }, orderBy: { shotIndex: 'asc' } });
  }

  async getShotById(shotId: string) {
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    return shot;
  }
}

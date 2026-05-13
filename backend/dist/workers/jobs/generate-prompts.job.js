"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGeneratePromptsJob = handleGeneratePromptsJob;
const common_1 = require("@nestjs/common");
const task_status_enum_1 = require("../../common/enums/task-status.enum");
async function handleGeneratePromptsJob(job, prisma, llmProvider) {
    const logger = new common_1.Logger('GeneratePromptsJob');
    const { taskId } = job.data;
    logger.log(`[task:${taskId}] generate-prompts`);
    await prisma.task.update({
        where: { id: taskId },
        data: { currentStep: task_status_enum_1.TaskStep.GENERATE_PROMPTS, progress: 40 },
    });
    const shots = await prisma.shot.findMany({
        where: { taskId, imagePrompt: null },
        orderBy: { shotIndex: 'asc' },
    });
    if (shots.length === 0) {
        logger.log(`[task:${taskId}] all shots already have prompts, skipping`);
        await job.updateProgress(100);
        return;
    }
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
//# sourceMappingURL=generate-prompts.job.js.map
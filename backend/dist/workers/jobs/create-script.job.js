"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateScriptJob = handleCreateScriptJob;
const common_1 = require("@nestjs/common");
const task_status_enum_1 = require("../../common/enums/task-status.enum");
async function handleCreateScriptJob(job, prisma, llmProvider, queue) {
    const logger = new common_1.Logger('CreateScriptJob');
    const { taskId, input } = job.data;
    logger.log(`[task:${taskId}] start create-script`);
    await prisma.task.update({
        where: { id: taskId },
        data: { status: task_status_enum_1.TaskStatus.RUNNING, currentStep: task_status_enum_1.TaskStep.CREATE_SCRIPT, progress: 5 },
    });
    try {
        const output = await llmProvider.generateStoryboard(input);
        await prisma.task.update({
            where: { id: taskId },
            data: {
                outputJson: JSON.stringify(output),
                currentStep: task_status_enum_1.TaskStep.GENERATE_IMAGES,
                progress: 60,
            },
        });
        await prisma.shot.deleteMany({ where: { taskId } });
        await prisma.beat.deleteMany({ where: { taskId } });
        const beatIdMap = new Map();
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
                    actionVerb: shot.actionVerb ?? null,
                    imagePrompt: shot.image_prompt,
                    status: 'pending',
                })),
            });
        }
        await job.updateProgress(60);
        logger.log(`[task:${taskId}] create-script done, shots=${output.shots?.length}, enqueueing generate_images`);
        await queue.add(task_status_enum_1.TaskStep.GENERATE_IMAGES, {
            taskId,
            options: {
                aspect_ratio: input.aspect_ratio ?? '9:16',
                quality: 'medium',
            },
        }, { attempts: 2, backoff: { type: 'exponential', delay: 5000 } });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`[task:${taskId}] create-script failed: ${msg}`);
        await prisma.task.update({
            where: { id: taskId },
            data: { status: task_status_enum_1.TaskStatus.FAILED, errorMessage: msg },
        });
        throw error;
    }
}
//# sourceMappingURL=create-script.job.js.map
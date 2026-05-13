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
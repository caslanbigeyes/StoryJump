"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGenerateImagesJob = handleGenerateImagesJob;
const common_1 = require("@nestjs/common");
const task_status_enum_1 = require("../../common/enums/task-status.enum");
const BATCH_SIZE = 2;
async function handleGenerateImagesJob(job, prisma, imageProvider, queue) {
    const logger = new common_1.Logger('GenerateImagesJob');
    const { taskId, options } = job.data;
    logger.log(`[task:${taskId}] start generate-images`);
    await prisma.task.update({
        where: { id: taskId },
        data: { currentStep: task_status_enum_1.TaskStep.GENERATE_IMAGES, progress: 60 },
    });
    try {
        const shots = await prisma.shot.findMany({
            where: { taskId },
            orderBy: { shotIndex: 'asc' },
        });
        const total = shots.length;
        if (total === 0) {
            logger.warn(`[task:${taskId}] no shots found, marking done`);
            await prisma.task.update({
                where: { id: taskId },
                data: { status: task_status_enum_1.TaskStatus.SUCCESS, currentStep: task_status_enum_1.TaskStep.DONE, progress: 100 },
            });
            return;
        }
        logger.log(`[task:${taskId}] generating images for ${total} shots`);
        let completed = 0;
        for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
            const batch = shots.slice(batchStart, batchStart + BATCH_SIZE);
            await Promise.all(batch.map(async (shot) => {
                if (!shot.imagePrompt) {
                    logger.warn(`[task:${taskId}] shot ${shot.shotIndex} has no imagePrompt, skipping`);
                    completed++;
                    return;
                }
                try {
                    const imageUrl = await imageProvider.generateImage(shot.imagePrompt, options);
                    await prisma.shot.update({
                        where: { id: shot.id },
                        data: { imageUrl, status: 'image_done' },
                    });
                    await prisma.asset.create({
                        data: {
                            taskId,
                            shotId: shot.id,
                            type: 'image',
                            url: imageUrl,
                            provider: 'kling',
                        },
                    });
                    logger.log(`[task:${taskId}] shot ${shot.shotIndex}/${total} image done`);
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    logger.error(`[task:${taskId}] shot ${shot.shotIndex} image failed: ${msg}`);
                    await prisma.shot.update({
                        where: { id: shot.id },
                        data: { status: 'image_failed' },
                    });
                }
                completed++;
            }));
            const progress = 60 + Math.round((completed / total) * 35);
            await prisma.task.update({ where: { id: taskId }, data: { progress } });
            await job.updateProgress(Math.round((completed / total) * 100));
        }
        const failedCount = await prisma.shot.count({
            where: { taskId, status: 'image_failed' },
        });
        const successCount = await prisma.shot.count({
            where: { taskId, status: 'image_done' },
        });
        logger.log(`[task:${taskId}] generate-images done: success=${successCount}, failed=${failedCount}`);
        if (queue && successCount > 0) {
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    currentStep: task_status_enum_1.TaskStep.GENERATE_TTS,
                    progress: 75,
                    ...(failedCount > 0 && {
                        errorMessage: `${failedCount}/${total} shots failed to generate image`,
                    }),
                },
            });
            await queue.add(task_status_enum_1.TaskStep.GENERATE_TTS, { taskId }, { attempts: 2, backoff: { type: 'exponential', delay: 5000 } });
            return;
        }
        await prisma.task.update({
            where: { id: taskId },
            data: {
                status: task_status_enum_1.TaskStatus.SUCCESS,
                currentStep: task_status_enum_1.TaskStep.DONE,
                progress: 100,
                ...(failedCount > 0 && {
                    errorMessage: `${failedCount}/${total} shots failed to generate image`,
                }),
            },
        });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`[task:${taskId}] generate-images fatal: ${msg}`);
        await prisma.task.update({
            where: { id: taskId },
            data: { status: task_status_enum_1.TaskStatus.FAILED, errorMessage: msg },
        });
        throw error;
    }
}
//# sourceMappingURL=generate-images.job.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGenerateImagesJob = handleGenerateImagesJob;
const common_1 = require("@nestjs/common");
const task_status_enum_1 = require("../../common/enums/task-status.enum");
async function handleGenerateImagesJob(job, prisma, imageProvider) {
    const logger = new common_1.Logger('GenerateImagesJob');
    const { taskId, options } = job.data;
    logger.log(`Starting generate-images job for task ${taskId}`);
    await prisma.task.update({
        where: { id: taskId },
        data: {
            currentStep: task_status_enum_1.TaskStep.GENERATE_IMAGES,
            progress: 55,
        },
    });
    try {
        const shots = await prisma.shot.findMany({
            where: { taskId },
            orderBy: { shotIndex: 'asc' },
        });
        const total = shots.length;
        for (let i = 0; i < total; i++) {
            const shot = shots[i];
            if (!shot.imagePrompt) {
                logger.warn(`Shot ${shot.id} has no imagePrompt, skipping`);
                continue;
            }
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
                    provider: 'flux',
                },
            });
            const progress = 55 + Math.round(((i + 1) / total) * 20);
            await prisma.task.update({ where: { id: taskId }, data: { progress } });
            await job.updateProgress(Math.round(((i + 1) / total) * 100));
        }
        logger.log(`Generated images for all ${total} shots in task ${taskId}`);
    }
    catch (error) {
        logger.error(`Failed to generate images for task ${taskId}`, error);
        throw error;
    }
}
//# sourceMappingURL=generate-images.job.js.map
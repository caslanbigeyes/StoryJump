"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSplitStoryboardJob = handleSplitStoryboardJob;
const common_1 = require("@nestjs/common");
const task_status_enum_1 = require("../../common/enums/task-status.enum");
async function handleSplitStoryboardJob(job, prisma, _llmProvider) {
    const logger = new common_1.Logger('SplitStoryboardJob');
    const { taskId } = job.data;
    logger.log(`[task:${taskId}] split-storyboard (no-op in MVP, shots already created)`);
    await prisma.task.update({
        where: { id: taskId },
        data: { currentStep: task_status_enum_1.TaskStep.SPLIT_STORYBOARD, progress: 20 },
    });
    await job.updateProgress(100);
}
//# sourceMappingURL=split-storyboard.job.js.map
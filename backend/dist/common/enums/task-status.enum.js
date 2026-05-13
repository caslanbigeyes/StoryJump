"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStep = exports.TaskStatus = void 0;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["SUCCESS"] = "success";
    TaskStatus["FAILED"] = "failed";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskStep;
(function (TaskStep) {
    TaskStep["CREATE_SCRIPT"] = "create_script";
    TaskStep["SPLIT_STORYBOARD"] = "split_storyboard";
    TaskStep["GENERATE_PROMPTS"] = "generate_prompts";
    TaskStep["GENERATE_IMAGES"] = "generate_images";
    TaskStep["GENERATE_TTS"] = "generate_tts";
    TaskStep["GENERATE_VIDEO"] = "generate_video";
    TaskStep["DONE"] = "done";
})(TaskStep || (exports.TaskStep = TaskStep = {}));
//# sourceMappingURL=task-status.enum.js.map
export declare enum TaskStatus {
    PENDING = "pending",
    RUNNING = "running",
    SUCCESS = "success",
    FAILED = "failed"
}
export declare enum TaskStep {
    CREATE_SCRIPT = "create_script",
    SPLIT_STORYBOARD = "split_storyboard",
    GENERATE_PROMPTS = "generate_prompts",
    GENERATE_IMAGES = "generate_images",
    GENERATE_TTS = "generate_tts",
    GENERATE_VIDEO = "generate_video",
    DONE = "done"
}

import { LLMProvider, TaskInput, StoryScript } from '../../providers/llm/llm.provider';
export declare class ScriptService {
    private readonly llmProvider;
    private readonly logger;
    constructor(llmProvider: LLMProvider);
    generateScript(input: TaskInput): Promise<StoryScript>;
    rewriteScript(script: StoryScript, instructions?: string): Promise<StoryScript>;
}

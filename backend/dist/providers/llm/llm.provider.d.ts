export interface TaskInput {
    title: string;
    topic: string;
    genre: string;
    era: string;
    location: string;
    tone: string;
    target_duration: number;
    shot_count: number;
    aspect_ratio: string;
    language: string;
    visual_style: string;
    main_characters: Array<{
        name: string;
        age: number;
        gender: string;
        appearance: string;
        personality: string;
    }>;
}
export interface CharacterBible {
    character_id: string;
    name: string;
    fixed_description: string;
    default_costume: string;
    forbidden_changes: string[];
}
export interface StoryScript {
    title: string;
    logline: string;
    theme: string;
    structure: {
        beginning: string;
        development: string;
        turning_point: string;
        ending: string;
    };
    narration: string;
}
export interface ShotCamera {
    shot_size: string;
    angle: string;
    movement: string;
}
export interface ShotVisual {
    lighting: string;
    color_palette: string;
    composition: string;
}
export interface ShotData {
    shot_id: number;
    duration: number;
    scene: string;
    time: string;
    location: string;
    character: string[];
    action: string;
    emotion: string;
    camera: ShotCamera;
    visual: ShotVisual;
    narration: string;
    image_prompt: string;
    negative_prompt: string;
}
export interface StoryboardValidation {
    shot_count_match: boolean;
    character_consistency: boolean;
    era_consistency: boolean;
    all_actions_visualizable: boolean;
    no_abstract_only_shots: boolean;
    all_prompts_ready: boolean;
}
export interface StoryboardOutput {
    meta: {
        title: string;
        genre: string;
        duration: number;
        shot_count: number;
        aspect_ratio: string;
        visual_style: string;
    };
    character_bible: CharacterBible[];
    script: StoryScript;
    shots: ShotData[];
    validation: StoryboardValidation;
}
export declare const LLM_PROVIDER_TOKEN = "LLM_PROVIDER";
export declare abstract class LLMProvider {
    abstract generateStoryboard(input: TaskInput): Promise<StoryboardOutput>;
    abstract generateScript(input: TaskInput): Promise<StoryScript>;
    abstract splitStoryboard(script: StoryScript, input: TaskInput): Promise<ShotData[]>;
    abstract generateImagePrompts(shots: ShotData[], characterBible: CharacterBible[], meta: StoryboardOutput['meta']): Promise<Array<{
        shot_id: number;
        image_prompt: string;
        negative_prompt: string;
    }>>;
}

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
    beat_id?: number;
    duration: number;
    shot_type?: string;
    inherit_from?: number | null;
    scene: string;
    time: string;
    location: string;
    character: string[];
    action: string;
    emotion: string;
    continuity?: {
        character_position?: string;
        action_state?: string;
        scene_state?: string;
    };
    camera: ShotCamera;
    visual: ShotVisual;
    narration: string;
    image_prompt: string;
    negative_prompt: string;
}
export interface StoryBeat {
    beat_id: number;
    goal: string;
    emotion: string;
    event: string;
    duration: number;
    narration: string;
    shot_count: number;
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
    beats?: StoryBeat[];
    meta: {
        title: string;
        genre: string;
        duration: number;
        shot_count: number;
        aspect_ratio: string;
        visual_style: string;
        style_token?: string;
        scene_context?: {
            location: string;
            era: string;
            tone: string;
            aspect_ratio: string;
        };
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
    abstract splitStoryboard(script: StoryScript, input: TaskInput, characterBible?: CharacterBible[]): Promise<ShotData[]>;
    abstract generateImagePrompts(shots: ShotData[], characterBible: CharacterBible[], meta: StoryboardOutput['meta']): Promise<Array<{
        shot_id: number;
        image_prompt: string;
        negative_prompt: string;
    }>>;
}

// ============================================================
// 类型定义：对应 skills.md 的完整分镜数据结构
// ============================================================

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
  shot_size: string;   // e.g. "medium shot"
  angle: string;       // e.g. "eye level"
  movement: string;    // e.g. "slow push in"
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

/** 剧情节拍：Story → Beat → Shot 叙事层级的中间层 */
export interface StoryBeat {
  beat_id: number;
  goal: string;      // 剧情目的 e.g. "建立危机"
  emotion: string;   // 情绪基调 e.g. "压迫"
  event: string;     // 发生的具体事件 e.g. "魔种冲破城门"
  duration: number;  // 该节拍占用秒数
  narration: string; // 驱动剧情的旁白（一句话）
  shot_count: number; // 该节拍分配的镜头数
}

export interface StoryboardValidation {
  shot_count_match: boolean;
  character_consistency: boolean;
  era_consistency: boolean;
  all_actions_visualizable: boolean;
  no_abstract_only_shots: boolean;
  all_prompts_ready: boolean;
}

/** skills.md 最终统一输出格式 */
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

// ============================================================
// DI 注入 Token
// ============================================================
export const LLM_PROVIDER_TOKEN = 'LLM_PROVIDER';

// ============================================================
// 抽象基类
// ============================================================
export abstract class LLMProvider {
  /**
   * 一次性生成完整分镜输出（剧本 + 分镜 + prompt + 校验）
   * 对应 skills.md 的 7 步工作流
   */
  abstract generateStoryboard(input: TaskInput): Promise<StoryboardOutput>;

  /**
   * 仅生成剧本文案（用于手动编辑场景）
   */
  abstract generateScript(input: TaskInput): Promise<StoryScript>;

  /**
   * 将已有剧本拆分为分镜
   */
  abstract splitStoryboard(
    script: StoryScript,
    input: TaskInput,
    characterBible?: CharacterBible[],
  ): Promise<ShotData[]>;

  /**
   * 为已有分镜批量生成生图 prompt
   */
  abstract generateImagePrompts(
    shots: ShotData[],
    characterBible: CharacterBible[],
    meta: StoryboardOutput['meta'],
  ): Promise<Array<{ shot_id: number; image_prompt: string; negative_prompt: string }>>;
}

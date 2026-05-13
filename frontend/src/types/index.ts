// ---- 枚举 ----

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum TaskStep {
  CREATE_SCRIPT = 'create_script',
  SPLIT_STORYBOARD = 'split_storyboard',
  GENERATE_PROMPTS = 'generate_prompts',
  GENERATE_IMAGES = 'generate_images',
  GENERATE_TTS = 'generate_tts',
  GENERATE_VIDEO = 'generate_video',
  DONE = 'done',
}

// ---- 接口 ----

export interface User {
  id: string;
  email: string;
  credits: number;
  createdAt: string;
}

export interface Shot {
  id: string;
  taskId: string;
  shotIndex: number;
  sceneText: string | null;
  cameraAngle: string | null;
  characterAction: string | null;
  imagePrompt: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  status: string;
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

export interface StoryboardResult {
  meta: {
    title: string;
    genre: string;
    duration: number;
    shot_count: number;
    aspect_ratio: string;
    visual_style: string;
  };
  script: StoryScript;
  shots: Array<{
    shot_id: number;
    duration: number;
    scene: string;
    time: string;
    location: string;
    character: string[];
    action: string;
    emotion: string;
    camera: {
      shot_size: string;
      angle: string;
      movement: string;
    };
    visual: {
      lighting: string;
      color_palette: string;
      composition: string;
    };
    narration: string;
    image_prompt: string;
    negative_prompt: string;
  }>;
}

export interface Asset {
  id: string;
  taskId: string;
  shotId: string | null;
  type: 'image' | 'audio' | 'video';
  url: string;
  provider: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  status: TaskStatus;
  currentStep: TaskStep;
  progress: number;
  createdAt: string;
  updatedAt: string;
  shots?: Shot[];
}

export interface TaskStatusResult {
  status: TaskStatus;
  currentStep: TaskStep;
  progress: number;
  errorMessage?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ---- API 响应 ----

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}

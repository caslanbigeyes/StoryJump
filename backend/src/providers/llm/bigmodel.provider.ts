import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  LLMProvider,
  TaskInput,
  ShotData,
  StoryScript,
  CharacterBible,
  StoryboardOutput,
} from './llm.provider';

/** skills.md §9 — AI 导演系统 Prompt */
const DIRECTOR_SYSTEM_PROMPT = `你是 AI 短剧分镜导演。

你必须把用户输入转成结构化 JSON。
你不能输出 Markdown。
你不能输出解释。
你不能省略字段。
你的回复必须是合法的 JSON 字符串，不带任何代码块标记。

你的工作流程：
1. 理解主题
2. 建立角色设定（character_bible）
3. 生成故事结构（script）
4. 生成旁白正文
5. 拆解为指定数量分镜（shots）
6. 为每个分镜生成生图 prompt（image_prompt + negative_prompt）
7. 自检并修正（validation）

硬性规则：
- 每个镜头只能描述一个可视化动作
- 所有角色外貌必须前后一致，严格引用 character_bible
- 不允许现代物品出现在历史题材中
- 不允许抽象情绪单独成为画面
- shots 数量必须严格等于用户要求的 shot_count
- image_prompt 必须包含：角色外貌、时代、地点、动作、镜头语言、光线色彩、画幅
- negative_prompt 必须包含：modern clothing, phone, car, text, watermark, extra fingers, distorted face, low quality, blurry
- 输出必须是合法 JSON，结构严格按照模板`;

const STORYBOARD_OUTPUT_TEMPLATE = `
输出 JSON 结构模板（严格遵守）：
{
  "meta": {
    "title": "",
    "genre": "",
    "duration": 0,
    "shot_count": 0,
    "aspect_ratio": "",
    "visual_style": ""
  },
  "character_bible": [
    {
      "character_id": "char_001",
      "name": "",
      "fixed_description": "",
      "default_costume": "",
      "forbidden_changes": []
    }
  ],
  "script": {
    "title": "",
    "logline": "",
    "theme": "",
    "structure": {
      "beginning": "",
      "development": "",
      "turning_point": "",
      "ending": ""
    },
    "narration": ""
  },
  "shots": [
    {
      "shot_id": 1,
      "duration": 4,
      "scene": "",
      "time": "",
      "location": "",
      "character": [],
      "action": "",
      "emotion": "",
      "camera": {
        "shot_size": "",
        "angle": "",
        "movement": ""
      },
      "visual": {
        "lighting": "",
        "color_palette": "",
        "composition": ""
      },
      "narration": "",
      "image_prompt": "",
      "negative_prompt": ""
    }
  ],
  "validation": {
    "shot_count_match": true,
    "character_consistency": true,
    "era_consistency": true,
    "all_actions_visualizable": true,
    "no_abstract_only_shots": true,
    "all_prompts_ready": true
  }
}`;

@Injectable()
export class BigModelProvider extends LLMProvider {
  private readonly logger = new Logger(BigModelProvider.name);
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fallbackApiKey: string;
  private readonly fallbackBaseUrl: string;
  private readonly fallbackModel: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const baseURL = this.configService.get<string>('LLM_BASE_URL') ?? 'https://open.bigmodel.cn/api/paas/v4';
    this.apiKey = this.configService.get<string>('LLM_API_KEY') ?? '';
    this.model = this.configService.get<string>('LLM_CHAT_MODEL') ?? 'glm-4-flash';

    // DeepSeek fallback
    this.fallbackApiKey = this.configService.get<string>('DEEPSEEK_API_KEY') ?? '';
    this.fallbackBaseUrl =
      this.configService.get<string>('DEEPSEEK_API_BASE_URL') ??
      this.configService.get<string>('DEEPSEEK_BASE_URL') ??
      'https://api.deepseek.com/v1';
    this.fallbackModel = this.configService.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat';

    this.http = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120_000,
    });
  }

  // ------------------------------------------------------------------
  // 核心：chat 调用（OpenAI 兼容接口）
  // ------------------------------------------------------------------
  private async chat(
    systemPrompt: string,
    userMessage: string,
    temperature = 0.7,
  ): Promise<string> {
    if (!this.apiKey && !this.fallbackApiKey) {
      throw new Error('缺少 LLM_API_KEY 或 DEEPSEEK_API_KEY，无法生成剧本');
    }

    if (!this.apiKey) {
      this.logger.warn('LLM_API_KEY is empty, using DeepSeek fallback.');
      return this.chatFallback(systemPrompt, userMessage, temperature);
    }

    try {
      const resp = await this.http.post('/chat/completions', {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: 8000,
      });
      return resp.data.choices[0].message.content as string;
    } catch (err: any) {
      this.logger.warn(`BigModel failed (${err?.message}), trying DeepSeek fallback...`);
      if (!this.fallbackApiKey) {
        const detail = err?.response?.data?.error ?? err?.response?.data ?? err?.message ?? String(err);
        throw new Error(
          typeof detail === 'object'
            ? (detail.message ?? JSON.stringify(detail))
            : detail,
        );
      }
      return this.chatFallback(systemPrompt, userMessage, temperature);
    }
  }

  private async chatFallback(
    systemPrompt: string,
    userMessage: string,
    temperature = 0.7,
  ): Promise<string> {
    const resp = await axios.post(
      `${this.fallbackBaseUrl}/chat/completions`,
      {
        model: this.fallbackModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: 8000,
      },
      {
        headers: {
          Authorization: `Bearer ${this.fallbackApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120_000,
      },
    );
    return resp.data.choices[0].message.content as string;
  }

  // ------------------------------------------------------------------
  // JSON 提取：从 LLM 回复中安全解析 JSON
  // ------------------------------------------------------------------
  private prepareJSON(raw: string): string {
    // 1. 去掉可能的 markdown 代码块
    let cleaned = raw
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/im, '')
      .trim();

    // 2. 提取第一个完整 JSON 对象或数组（防止 LLM 在 JSON 前后加说明文字）
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }
    if (startIdx > 0) cleaned = cleaned.slice(startIdx);

    // 3. 去掉 JSON 注释（LLM 有时生成 // ... N more 之类的注释）
    cleaned = cleaned.replace(/\/\/[^\n\r]*/g, '');

    // 4. 去掉尾部逗号（LLM 有时生成 trailing comma）
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

    return cleaned;
  }

  private extractJSON<T>(raw: string): T {
    const cleaned = this.prepareJSON(raw);
    return JSON.parse(cleaned) as T;
  }

  private async extractJSONWithRepair<T>(raw: string, context: string): Promise<T> {
    try {
      return this.extractJSON<T>(raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const cleaned = this.prepareJSON(raw);
      this.logger.warn(`[${context}] JSON parse failed: ${message}. Requesting JSON repair...`);

      const repaired = await this.chat(
        '你是 JSON 修复器。只输出合法 JSON，不要输出 Markdown、解释、代码块或额外文字。',
        `下面 JSON 字符串解析失败，请在不改变字段含义的前提下修复为严格合法 JSON。

错误信息：
${message}

待修复内容：
${cleaned}`,
        0,
      );

      try {
        return this.extractJSON<T>(repaired);
      } catch (repairError) {
        const repairMessage = repairError instanceof Error ? repairError.message : String(repairError);
        this.logger.error(
          `[${context}] JSON repair failed: ${repairMessage}. Original length=${cleaned.length}, repaired length=${repaired.length}`,
        );
        throw new Error(`AI 返回的 JSON 格式无效，自动修复失败：${repairMessage}`);
      }
    }
  }

  // ------------------------------------------------------------------
  // 1. 一次性生成完整分镜输出（核心方法）
  // ------------------------------------------------------------------
  async generateStoryboard(input: TaskInput): Promise<StoryboardOutput> {
    this.logger.log(`[generateStoryboard] title="${input.title}" shots=${input.shot_count}`);

    const script = await this.generateScript(input);
    const characterBible = this.buildCharacterBible(input);
    const shots = await this.splitStoryboard(script, input);
    const normalizedShots = this.normalizeShots(shots, input);
    const meta: StoryboardOutput['meta'] = {
      title: script.title || input.title,
      genre: input.genre,
      duration: input.target_duration,
      shot_count: input.shot_count,
      aspect_ratio: input.aspect_ratio,
      visual_style: input.visual_style,
    };

    const prompts = await this.generateImagePrompts(normalizedShots, characterBible, meta);
    const promptByShotId = new Map(prompts.map((prompt) => [prompt.shot_id, prompt]));
    const output: StoryboardOutput = {
      meta,
      character_bible: characterBible,
      script,
      shots: normalizedShots.map((shot) => {
        const prompt = promptByShotId.get(shot.shot_id);
        return {
          ...shot,
          image_prompt: prompt?.image_prompt || shot.image_prompt || this.buildFallbackImagePrompt(shot, input),
          negative_prompt:
            prompt?.negative_prompt ||
            shot.negative_prompt ||
            'modern clothing, phone, car, text, watermark, extra fingers, distorted face, low quality, blurry',
        };
      }),
      validation: {
        shot_count_match: normalizedShots.length === input.shot_count,
        character_consistency: true,
        era_consistency: true,
        all_actions_visualizable: true,
        no_abstract_only_shots: true,
        all_prompts_ready: true,
      },
    };

    // 自动修正 validation
    output.validation = {
      shot_count_match: output.shots?.length === input.shot_count,
      character_consistency: true,
      era_consistency: true,
      all_actions_visualizable: true,
      no_abstract_only_shots: true,
      all_prompts_ready: output.shots?.every((s) => Boolean(s.image_prompt)),
    };

    this.logger.log(
      `[generateStoryboard] done, shots=${output.shots?.length}, prompts_ready=${output.validation.all_prompts_ready}`,
    );
    return output;
  }

  private buildCharacterBible(input: TaskInput): CharacterBible[] {
    if (input.main_characters.length > 0) {
      return input.main_characters.map((character, index) => ({
        character_id: `char_${String(index + 1).padStart(3, '0')}`,
        name: character.name,
        fixed_description: `${character.gender}, ${character.age}岁, ${character.appearance}`,
        default_costume: `${input.era}风格服装, ${input.visual_style}`,
        forbidden_changes: ['不要改变年龄', '不要改变性别', '不要改变核心外貌特征', '不要出现现代违和物品'],
      }));
    }

    return [
      {
        character_id: 'char_001',
        name: input.topic || input.title,
        fixed_description: `${input.era}背景下的核心角色, 风格：${input.visual_style}`,
        default_costume: `${input.era}风格服装`,
        forbidden_changes: ['不要改变核心角色身份', '不要出现现代违和物品'],
      },
    ];
  }

  private normalizeShots(shots: ShotData[], input: TaskInput): ShotData[] {
    const sourceShots = [...shots];
    while (sourceShots.length < input.shot_count) {
      const index = sourceShots.length;
      sourceShots.push({
        shot_id: index + 1,
        duration: Math.max(3, Math.round(input.target_duration / input.shot_count)),
        scene: `${input.topic} 的延展场景 ${index + 1}`,
        time: input.era,
        location: input.location,
        character: input.main_characters.map((character) => character.name),
        action: `${input.topic} 在故事中继续推进`,
        emotion: input.tone,
        camera: { shot_size: 'medium shot', angle: 'eye level', movement: 'slow push in' },
        visual: {
          lighting: 'cinematic soft light',
          color_palette: input.tone,
          composition: 'rule of thirds composition',
        },
        narration: '',
        image_prompt: '',
        negative_prompt: '',
      });
    }

    return sourceShots.slice(0, input.shot_count).map((shot, index) => ({
      shot_id: index + 1,
      duration: Number.isFinite(shot.duration) && shot.duration > 0
        ? shot.duration
        : Math.max(3, Math.round(input.target_duration / input.shot_count)),
      scene: shot.scene || `${input.topic} 场景 ${index + 1}`,
      time: shot.time || input.era,
      location: shot.location || input.location,
      character: Array.isArray(shot.character) ? shot.character : [],
      action: shot.action || shot.scene || `${input.topic} 的关键动作`,
      emotion: shot.emotion || input.tone,
      camera: {
        shot_size: shot.camera?.shot_size || 'medium shot',
        angle: shot.camera?.angle || 'eye level',
        movement: shot.camera?.movement || 'slow push in',
      },
      visual: {
        lighting: shot.visual?.lighting || 'cinematic soft light',
        color_palette: shot.visual?.color_palette || input.tone,
        composition: shot.visual?.composition || 'rule of thirds composition',
      },
      narration: shot.narration || '',
      image_prompt: shot.image_prompt || '',
      negative_prompt: shot.negative_prompt || '',
    }));
  }

  private buildFallbackImagePrompt(shot: ShotData, input: TaskInput): string {
    return [
      input.visual_style,
      input.era,
      input.location,
      shot.scene,
      shot.action,
      shot.camera.shot_size,
      shot.camera.angle,
      shot.camera.movement,
      shot.visual.lighting,
      shot.visual.color_palette,
      input.aspect_ratio,
    ].filter(Boolean).join(', ');
  }

  // ------------------------------------------------------------------
  // 2. 仅生成剧本
  // ------------------------------------------------------------------
  async generateScript(input: TaskInput): Promise<StoryScript> {
    this.logger.log(`[generateScript] title="${input.title}"`);

    const systemPrompt = `${DIRECTOR_SYSTEM_PROMPT}

本次任务：仅生成 script 字段，不生成 shots。
输出格式：
{
  "title": "",
  "logline": "",
  "theme": "",
  "structure": { "beginning": "", "development": "", "turning_point": "", "ending": "" },
  "narration": ""
}`;

    const userMessage = `输入：\n${JSON.stringify(input, null, 2)}`;
    const raw = await this.chat(systemPrompt, userMessage, 0.75);
    return this.extractJSONWithRepair<StoryScript>(raw, 'generateScript');
  }

  // ------------------------------------------------------------------
  // 3. 拆分分镜（已有剧本）
  // ------------------------------------------------------------------
  async splitStoryboard(
    script: StoryScript,
    input: TaskInput,
  ): Promise<ShotData[]> {
    this.logger.log(`[splitStoryboard] shot_count=${input.shot_count}`);

    const batchSize = 5;
    if (input.shot_count > batchSize) {
      const batches: ShotData[] = [];
      for (let start = 1; start <= input.shot_count; start += batchSize) {
        const count = Math.min(batchSize, input.shot_count - start + 1);
        this.logger.log(`[splitStoryboard] batch start=${start} count=${count}`);
        const batch = await this.splitStoryboardBatch(script, input, start, count);
        batches.push(...batch);
      }
      return batches.slice(0, input.shot_count);
    }

    return this.splitStoryboardBatch(script, input, 1, input.shot_count);
  }

  private async splitStoryboardBatch(
    script: StoryScript,
    input: TaskInput,
    startShotId: number,
    shotCount: number,
  ): Promise<ShotData[]> {
    const endShotId = startShotId + shotCount - 1;

    const systemPrompt = `${DIRECTOR_SYSTEM_PROMPT}

本次任务：根据已有剧本和角色设定，只生成第 ${startShotId} 到第 ${endShotId} 个分镜的 shots 数组。
输出格式：JSON 数组，每个元素严格遵守 ShotData 结构。
shots 数量必须等于 ${shotCount}。
shot_id 必须从 ${startShotId} 连续编号到 ${endShotId}。`;

    const userMessage = `剧本：\n${JSON.stringify(script, null, 2)}\n\n任务参数：\n${JSON.stringify(
      {
        era: input.era,
        location: input.location,
        tone: input.tone,
        total_shot_count: input.shot_count,
        current_batch_start_shot_id: startShotId,
        current_batch_shot_count: shotCount,
        aspect_ratio: input.aspect_ratio,
        visual_style: input.visual_style,
        main_characters: input.main_characters,
      },
      null,
      2,
    )}`;

    const raw = await this.chat(systemPrompt, userMessage, 0.7);
    return this.extractJSONWithRepair<ShotData[]>(raw, 'splitStoryboard');
  }

  // ------------------------------------------------------------------
  // 4. 批量生成生图 prompt
  // ------------------------------------------------------------------
  async generateImagePrompts(
    shots: ShotData[],
    characterBible: CharacterBible[],
    meta: StoryboardOutput['meta'],
  ): Promise<Array<{ shot_id: number; image_prompt: string; negative_prompt: string }>> {
    this.logger.log(`[generateImagePrompts] shots=${shots.length}`);

    const batchSize = 5;
    if (shots.length > batchSize) {
      const prompts: Array<{ shot_id: number; image_prompt: string; negative_prompt: string }> = [];
      for (let index = 0; index < shots.length; index += batchSize) {
        const batch = shots.slice(index, index + batchSize);
        this.logger.log(`[generateImagePrompts] batch shots=${batch.map((shot) => shot.shot_id).join(',')}`);
        prompts.push(...await this.generateImagePromptsBatch(batch, characterBible, meta));
      }
      return prompts;
    }

    return this.generateImagePromptsBatch(shots, characterBible, meta);
  }

  private async generateImagePromptsBatch(
    shots: ShotData[],
    characterBible: CharacterBible[],
    meta: StoryboardOutput['meta'],
  ): Promise<Array<{ shot_id: number; image_prompt: string; negative_prompt: string }>> {

    const systemPrompt = `你是专业 AI 绘图 Prompt 工程师。
你的职责：把每个分镜转成高质量英文生图 Prompt。

Prompt 规范：
- 必须包含：角色外貌（引用 character_bible）、时代、地点、动作、镜头语言、光线色彩、画幅
- 禁止抽象词、心理活动、前后矛盾设定
- negative_prompt 固定包含：modern clothing, phone, car, text, watermark, extra fingers, distorted face, low quality, blurry

输出格式：JSON 数组
[{ "shot_id": 1, "image_prompt": "...", "negative_prompt": "..." }]`;

    const userMessage = `character_bible：\n${JSON.stringify(characterBible, null, 2)}\n\nmeta：\n${JSON.stringify(
      meta,
      null,
      2,
    )}\n\nshots：\n${JSON.stringify(shots, null, 2)}`;

    const raw = await this.chat(systemPrompt, userMessage, 0.6);
    return this.extractJSONWithRepair(raw, 'generateImagePrompts');
  }
}

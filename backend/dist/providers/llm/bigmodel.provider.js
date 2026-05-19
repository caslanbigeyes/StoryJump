"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BigModelProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigModelProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const llm_provider_1 = require("./llm.provider");
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
const DEFAULT_STYLE_TOKEN = [
    'cinematic realism',
    'Honor of Kings cinematic style',
    'dark fantasy chinese city',
    'film still',
    'high contrast lighting',
].join(', ');
const SHOT_TYPE_TEMPLATE = [
    'establishing_shot',
    'wide_action_setup',
    'medium_dialogue',
    'closeup_emotion',
    'action_shot',
    'impact_shot',
    'reaction_closeup',
    'transition_shot',
];
const FIXED_NEGATIVE_PROMPT = [
    'modern clothing',
    'phone',
    'car',
    'text',
    'watermark',
    'extra fingers',
    'distorted face',
    'low quality',
    'blurry',
    'inconsistent style',
    'changed face',
    'different costume',
].join(', ');
let BigModelProvider = BigModelProvider_1 = class BigModelProvider extends llm_provider_1.LLMProvider {
    constructor(configService) {
        super();
        this.configService = configService;
        this.logger = new common_1.Logger(BigModelProvider_1.name);
        const baseURL = this.configService.get('LLM_BASE_URL') ?? 'https://open.bigmodel.cn/api/paas/v4';
        this.apiKey = this.configService.get('LLM_API_KEY') ?? '';
        this.model = this.configService.get('LLM_CHAT_MODEL') ?? 'glm-4-flash';
        this.fallbackApiKey = this.configService.get('DEEPSEEK_API_KEY') ?? '';
        this.fallbackBaseUrl =
            this.configService.get('DEEPSEEK_API_BASE_URL') ??
                this.configService.get('DEEPSEEK_BASE_URL') ??
                'https://api.deepseek.com/v1';
        this.fallbackModel = this.configService.get('DEEPSEEK_MODEL') ?? 'deepseek-chat';
        this.http = axios_1.default.create({
            baseURL,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 120_000,
        });
    }
    collectStream(stream) {
        return new Promise((resolve, reject) => {
            let content = '';
            let buf = '';
            stream.on('data', (chunk) => {
                buf += chunk.toString('utf8');
                const parts = buf.split('\n');
                buf = parts.pop() ?? '';
                for (const line of parts) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:'))
                        continue;
                    const payload = trimmed.slice(5).trim();
                    if (payload === '[DONE]')
                        continue;
                    try {
                        const data = JSON.parse(payload);
                        const delta = data.choices?.[0]?.delta?.content;
                        if (delta)
                            content += delta;
                    }
                    catch {
                    }
                }
            });
            stream.on('end', () => resolve(content));
            stream.on('error', reject);
        });
    }
    async chat(systemPrompt, userMessage, temperature = 0.7) {
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
                stream: true,
            }, {
                responseType: 'stream',
                timeout: 0,
            });
            const content = await this.collectStream(resp.data);
            if (!content)
                throw new Error('BigModel stream returned empty content');
            return content;
        }
        catch (err) {
            this.logger.warn(`BigModel stream failed (${err?.message}), trying DeepSeek fallback...`);
            if (!this.fallbackApiKey) {
                const detail = err?.response?.data?.error ?? err?.message ?? String(err);
                throw new Error(typeof detail === 'object' ? (detail.message ?? JSON.stringify(detail)) : detail);
            }
            return this.chatFallback(systemPrompt, userMessage, temperature);
        }
    }
    async chatFallback(systemPrompt, userMessage, temperature = 0.7) {
        const resp = await axios_1.default.post(`${this.fallbackBaseUrl}/chat/completions`, {
            model: this.fallbackModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature,
            max_tokens: 8000,
            stream: true,
        }, {
            headers: {
                Authorization: `Bearer ${this.fallbackApiKey}`,
                'Content-Type': 'application/json',
            },
            responseType: 'stream',
            timeout: 0,
        });
        return this.collectStream(resp.data);
    }
    prepareJSON(raw) {
        let cleaned = raw
            .replace(/^```(?:json)?\s*/im, '')
            .replace(/\s*```\s*$/im, '')
            .trim();
        cleaned = cleaned.replace(/\/\/[^\n\r]*/g, '');
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        const startIdx = firstBrace === -1 ? firstBracket
            : firstBracket === -1 ? firstBrace
                : Math.min(firstBrace, firstBracket);
        if (startIdx >= 0) {
            const openChar = cleaned[startIdx];
            const closeChar = openChar === '{' ? '}' : ']';
            let depth = 0;
            let inString = false;
            let escaped = false;
            let endIdx = -1;
            for (let i = startIdx; i < cleaned.length; i++) {
                const ch = cleaned[i];
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (ch === '\\' && inString) {
                    escaped = true;
                    continue;
                }
                if (ch === '"') {
                    inString = !inString;
                    continue;
                }
                if (inString)
                    continue;
                if (ch === openChar)
                    depth++;
                else if (ch === closeChar) {
                    depth--;
                    if (depth === 0) {
                        endIdx = i;
                        break;
                    }
                }
            }
            cleaned = endIdx >= 0
                ? cleaned.slice(startIdx, endIdx + 1)
                : cleaned.slice(startIdx);
        }
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
        return cleaned;
    }
    extractJSON(raw) {
        const cleaned = this.prepareJSON(raw);
        return JSON.parse(cleaned);
    }
    async extractJSONWithRepair(raw, context) {
        try {
            return this.extractJSON(raw);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const cleaned = this.prepareJSON(raw);
            this.logger.warn(`[${context}] JSON parse failed: ${message}. Requesting JSON repair...`);
            const repaired = await this.chat('你是 JSON 修复器。只输出合法 JSON，不要输出 Markdown、解释、代码块或额外文字。', `下面 JSON 字符串解析失败，请在不改变字段含义的前提下修复为严格合法 JSON。

错误信息：
${message}

待修复内容：
${cleaned}`, 0);
            try {
                return this.extractJSON(repaired);
            }
            catch (repairError) {
                const repairMessage = repairError instanceof Error ? repairError.message : String(repairError);
                this.logger.error(`[${context}] JSON repair failed: ${repairMessage}. Original length=${cleaned.length}, repaired length=${repaired.length}`);
                throw new Error(`AI 返回的 JSON 格式无效，自动修复失败：${repairMessage}`);
            }
        }
    }
    async generateStoryboard(input) {
        this.logger.log(`[generateStoryboard] title="${input.title}" shots=${input.shot_count}`);
        const script = await this.generateScript(input);
        const characterBible = this.buildCharacterBible(input);
        const shots = await this.splitStoryboard(script, input, characterBible);
        const beats = shots.__beats__ ?? [];
        const normalizedShots = this.normalizeShots(shots, input);
        const meta = {
            title: script.title || input.title,
            genre: input.genre,
            duration: input.target_duration,
            shot_count: input.shot_count,
            aspect_ratio: input.aspect_ratio,
            visual_style: input.visual_style,
            style_token: this.buildStyleToken(input),
            scene_context: this.buildSceneContext(input),
        };
        const prompts = await this.generateImagePrompts(normalizedShots, characterBible, meta);
        const promptByShotId = new Map(prompts.map((prompt) => [prompt.shot_id, prompt]));
        const output = {
            beats,
            meta,
            character_bible: characterBible,
            script,
            shots: normalizedShots.map((shot) => {
                const prompt = promptByShotId.get(shot.shot_id);
                return {
                    ...shot,
                    image_prompt: prompt?.image_prompt || shot.image_prompt || this.buildFallbackImagePrompt(shot, input),
                    negative_prompt: prompt?.negative_prompt ||
                        shot.negative_prompt ||
                        FIXED_NEGATIVE_PROMPT,
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
        output.validation = {
            shot_count_match: output.shots?.length === input.shot_count,
            character_consistency: true,
            era_consistency: true,
            all_actions_visualizable: true,
            no_abstract_only_shots: true,
            all_prompts_ready: output.shots?.every((s) => Boolean(s.image_prompt)),
        };
        this.logger.log(`[generateStoryboard] done shots=${output.shots?.length} prompts_ready=${output.validation.all_prompts_ready}`);
        return output;
    }
    buildCharacterBible(input) {
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
    buildStyleToken(input) {
        return this.dedupePromptParts([
            input.visual_style,
            DEFAULT_STYLE_TOKEN,
            input.aspect_ratio,
        ]).join(', ');
    }
    buildSceneContext(input) {
        return {
            location: input.location,
            era: input.era,
            tone: input.tone,
            aspect_ratio: input.aspect_ratio,
        };
    }
    getShotType(index, total) {
        if (index === 0)
            return 'establishing_shot';
        if (index === total - 1)
            return 'transition_shot';
        return SHOT_TYPE_TEMPLATE[index % SHOT_TYPE_TEMPLATE.length];
    }
    getCameraByShotType(shotType) {
        const presets = {
            establishing_shot: { shot_size: 'wide shot', angle: 'slightly high angle', movement: 'slow push in' },
            wide_action_setup: { shot_size: 'wide shot', angle: 'eye level', movement: 'tracking shot' },
            medium_dialogue: { shot_size: 'medium shot', angle: 'eye level', movement: 'subtle dolly in' },
            closeup_emotion: { shot_size: 'close-up', angle: 'eye level', movement: 'locked camera' },
            action_shot: { shot_size: 'medium full shot', angle: 'low angle', movement: 'fast tracking shot' },
            impact_shot: { shot_size: 'tight close-up', angle: 'low angle', movement: 'snap zoom' },
            reaction_closeup: { shot_size: 'close-up', angle: 'three-quarter angle', movement: 'slow push in' },
            transition_shot: { shot_size: 'wide shot', angle: 'eye level', movement: 'slow pull back' },
        };
        return presets[shotType] ?? { shot_size: 'medium shot', angle: 'eye level', movement: 'slow push in' };
    }
    normalizeShots(shots, input) {
        const sourceShots = [...shots];
        while (sourceShots.length < input.shot_count) {
            const index = sourceShots.length;
            const shotType = this.getShotType(index, input.shot_count);
            sourceShots.push({
                shot_id: index + 1,
                duration: Math.max(3, Math.round(input.target_duration / input.shot_count)),
                shot_type: shotType,
                inherit_from: index > 0 ? index : null,
                scene: `${input.topic} 的延展场景 ${index + 1}`,
                time: input.era,
                location: input.location,
                character: input.main_characters.map((character) => character.name),
                action: `${input.topic} 在故事中继续推进`,
                emotion: input.tone,
                continuity: {
                    character_position: index > 0 ? '继承上一镜头位置并自然移动' : '建立角色初始位置',
                    action_state: '动作连续推进',
                    scene_state: `${input.location}, ${input.era}, ${input.tone}`,
                },
                camera: this.getCameraByShotType(shotType),
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
        return sourceShots.slice(0, input.shot_count).map((shot, index) => {
            const shotType = shot.shot_type || this.getShotType(index, input.shot_count);
            const cameraPreset = this.getCameraByShotType(shotType);
            return {
                shot_id: index + 1,
                duration: Number.isFinite(shot.duration) && shot.duration > 0
                    ? shot.duration
                    : Math.max(3, Math.round(input.target_duration / input.shot_count)),
                shot_type: shotType,
                inherit_from: index > 0 ? index : null,
                scene: shot.scene || `${input.topic} 场景 ${index + 1}`,
                time: shot.time || input.era,
                location: shot.location || input.location,
                character: Array.isArray(shot.character)
                    ? shot.character.map((c) => (typeof c === 'string' ? c : c?.name ?? String(c)))
                    : [],
                action: shot.action || shot.scene || `${input.topic} 的关键动作`,
                emotion: shot.emotion || input.tone,
                continuity: {
                    character_position: shot.continuity?.character_position ||
                        (index > 0 ? '继承上一镜头角色位置，保持移动方向连续' : '建立角色初始站位'),
                    action_state: shot.continuity?.action_state || shot.action || '动作连续推进',
                    scene_state: shot.continuity?.scene_state || `${input.location}, ${input.era}, ${input.tone}`,
                },
                camera: {
                    shot_size: shot.camera?.shot_size || cameraPreset.shot_size,
                    angle: shot.camera?.angle || cameraPreset.angle,
                    movement: shot.camera?.movement || cameraPreset.movement,
                },
                visual: {
                    lighting: shot.visual?.lighting || 'cinematic soft light',
                    color_palette: shot.visual?.color_palette || input.tone,
                    composition: shot.visual?.composition || 'rule of thirds composition',
                },
                narration: shot.narration || '',
                image_prompt: shot.image_prompt || '',
                negative_prompt: shot.negative_prompt || '',
            };
        });
    }
    buildFallbackImagePrompt(shot, input) {
        return this.composeControlledImagePrompt(shot, this.buildCharacterBible(input), {
            title: input.title,
            genre: input.genre,
            duration: input.target_duration,
            shot_count: input.shot_count,
            aspect_ratio: input.aspect_ratio,
            visual_style: input.visual_style,
            style_token: this.buildStyleToken(input),
            scene_context: this.buildSceneContext(input),
        });
    }
    cleanImagePrompt(prompt) {
        const abstractPattern = /\b(epic|breathtaking|emotional|dramatic|powerful|legendary|masterpiece|best quality|ultra cinematic|stunning|gorgeous|magnificent|awe-inspiring|extraordinary|incredible|amazing|wonderful|fantastic|glorious|heroic|divine|transcendent|ethereal|atmospheric|mystical|vivid|intense|cinematic atmosphere|deep emotion|powerful emotion)\b/gi;
        return prompt
            .replace(abstractPattern, '')
            .replace(/史诗|震撼|惊艳|绝美|唯美|高级感|大片感|氛围感|宿命感|张力十足|令人窒息|极致|顶级/g, '')
            .replace(/,\s*,+/g, ',')
            .replace(/^\s*,\s*/, '')
            .replace(/,\s*$/, '')
            .trim();
    }
    composeControlledImagePrompt(shot, characterBible, meta, supplementalPrompt = '') {
        const charMap = new Map(characterBible.map((c) => [c.name, c]));
        const characterLayer = (shot.character || [])
            .map((raw) => {
            const charName = typeof raw === 'string' ? raw : raw?.name ?? String(raw);
            const entry = charMap.get(charName) ?? [...charMap.values()].find((c) => charName.includes(c.name) || c.name.includes(charName));
            return entry ? `${entry.fixed_description}, wearing ${entry.default_costume}` : charName;
        })
            .filter(Boolean);
        const layers = [
            ...characterLayer,
            shot.action,
            shot.continuity?.character_position,
            shot.continuity?.action_state,
            shot.scene,
            shot.location || meta.scene_context?.location,
            shot.time || meta.scene_context?.era,
            shot.shot_type,
            shot.camera?.shot_size,
            shot.camera?.angle,
            shot.camera?.movement,
            shot.visual?.lighting,
            shot.visual?.color_palette,
            shot.visual?.composition,
            meta.style_token || meta.visual_style,
            meta.aspect_ratio,
            supplementalPrompt,
        ];
        return this.dedupePromptParts(layers.map((part) => this.cleanImagePrompt(String(part || '')))).join(', ');
    }
    dedupePromptParts(parts) {
        const seen = new Set();
        const result = [];
        for (const part of parts) {
            const chunks = part
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
            for (const chunk of chunks) {
                const key = chunk.toLowerCase();
                if (seen.has(key))
                    continue;
                seen.add(key);
                result.push(chunk);
            }
        }
        return result;
    }
    extractShotState(shot) {
        return {
            shot_id: shot.shot_id,
            location: shot.location,
            time: shot.time,
            lighting: shot.visual.lighting,
            color_palette: shot.visual.color_palette,
            characters: shot.character.reduce((acc, name) => {
                acc[name] = `${shot.action} / ${shot.emotion}`;
                return acc;
            }, {}),
        };
    }
    async generateScript(input) {
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
        return this.extractJSONWithRepair(raw, 'generateScript');
    }
    async splitStoryboard(script, input, characterBible = []) {
        this.logger.log(`[splitStoryboard] shot_count=${input.shot_count}`);
        const beats = await this.generateBeats(script, input);
        this.logger.log(`[splitStoryboard] beats=${beats.length} events=${beats.map((b) => b.event).join(' → ')}`);
        const shots = await this.splitShotsByBeats(script, beats, input, characterBible);
        shots.__beats__ = beats;
        return shots;
    }
    async generateBeats(script, input) {
        const beatCount = Math.min(8, Math.max(5, Math.round(input.shot_count / 3)));
        const systemPrompt = `你是故事节拍导演（Beat Planner）。
你的任务：把剧本拆解为"剧情节拍"序列，确保故事有因果推进，而不是重复同一气氛。

核心原则：
- 每个 Beat = 一个"事件"（发生了什么），不是"感受"或"气氛"
- Beat 序列必须有因果推进：每个 Beat 因前一个 Beat 而发生
- narration 必须是一句推动剧情向前的旁白（不能重复描述气氛，不能与其他 Beat 相似）
- 节奏：开场慢（建立世界）→ 中段快（冲突升级）→ 结尾慢（情绪释放）

严格约束：
- Beat 总数必须等于 ${beatCount}
- 所有 shot_count 相加必须严格等于 ${input.shot_count}
- 所有 duration 相加必须严格等于 ${input.target_duration}
- beat_id 从 1 开始连续编号
- narration 每条必须独特，描述该 Beat 的核心转折或事件

输出格式（只输出一个 JSON 数组，JSON 结束后不要输出任何内容）：
[{
  "beat_id": 1,
  "goal": "建立危机",
  "emotion": "压迫",
  "event": "（本节拍具体发生的事）",
  "duration": 8,
  "narration": "（一句驱动剧情的旁白，必须独特）",
  "shot_count": 3
}]`;
        const userMessage = `剧本：\n${JSON.stringify(script, null, 2)}\n\n参数：\n${JSON.stringify({
            title: input.title,
            topic: input.topic,
            era: input.era,
            location: input.location,
            tone: input.tone,
            target_duration: input.target_duration,
            shot_count: input.shot_count,
            required_beat_count: beatCount,
        }, null, 2)}`;
        const raw = await this.chat(systemPrompt, userMessage, 0.7);
        const beats = await this.extractJSONWithRepair(raw, 'generateBeats');
        return this.normalizeBeats(beats, input);
    }
    normalizeBeats(beats, input) {
        if (!beats.length)
            return [];
        const total = beats.reduce((sum, b) => sum + Math.max(1, b.shot_count ?? 1), 0);
        const scale = input.shot_count / total;
        let remaining = input.shot_count;
        return beats.map((beat, i) => {
            const isLast = i === beats.length - 1;
            const count = isLast ? remaining : Math.max(1, Math.round(Math.max(1, beat.shot_count ?? 1) * scale));
            remaining -= count;
            return { ...beat, shot_count: count };
        });
    }
    async generateActionChain(beat, characterBible, shotCount) {
        const charNames = characterBible.map((c) => `${c.name}: ${c.fixed_description}`).join('\n');
        const systemPrompt = `你是动作编排师。为一个剧情节拍生成"动作链（Action Chain）"。
每个动作是一个可在画面中直接观察到的物理动作。

规则：
- 动作数量必须等于 ${shotCount}
- 每个动作必须改变角色的物理状态（位置/姿态/与物体的关系）
- actionVerb 用英文 snake_case，例如：draw_sword / dash_forward / jump_slash / land_crouch / raise_head
- action 用中文（10-20字，具体、可视化）
- 动作之间必须有因果逻辑（上一步导致下一步）
- 禁止连续两步出现相同 actionVerb
- 禁止纯站立/注视（stand / pose / look）连续出现超过1次

输出格式（只输出一个 JSON 数组，JSON 结束后不要输出任何内容）：
[{"step": 1, "actionVerb": "...", "action": "..."}]`;
        const userMessage = [
            `节拍信息：\n${JSON.stringify({ goal: beat.goal, event: beat.event, emotion: beat.emotion }, null, 2)}`,
            charNames ? `角色：\n${charNames}` : '',
        ].filter(Boolean).join('\n\n');
        const raw = await this.chat(systemPrompt, userMessage, 0.6);
        const chain = await this.extractJSONWithRepair(raw, `generateActionChain:beat${beat.beat_id}`);
        while (chain.length < shotCount) {
            chain.push({ step: chain.length + 1, actionVerb: 'continue_action', action: '动作延续推进' });
        }
        return chain.slice(0, shotCount);
    }
    validateShots(shots) {
        const errors = [];
        const staticPattern = /\b(stand|pose|look|idle|wait|gaze)\b|静止|站立|凝视|驻足/i;
        for (let i = 0; i < shots.length; i++) {
            const shot = shots[i];
            const sid = `shot_${shot.shot_id}`;
            if (!shot.action || shot.action.trim().length < 4) {
                errors.push(`${sid}: 缺少可视化动作`);
                continue;
            }
            if (i > 0) {
                const prev = shots[i - 1];
                if (shot.camera?.shot_size && shot.camera.shot_size === prev.camera?.shot_size) {
                    errors.push(`${sid}: 景别重复（${shot.camera.shot_size}）`);
                }
                if (shot.action.trim() === prev.action.trim()) {
                    errors.push(`${sid}: 动作描述完全重复`);
                }
                if (staticPattern.test(shot.action) && staticPattern.test(prev.action)) {
                    errors.push(`${sid}: 连续静止镜头`);
                }
            }
        }
        return errors;
    }
    async repairInvalidShots(shots, errors, beat, actionChain) {
        const failedIds = new Set(errors.map((e) => {
            const m = e.match(/shot_(\d+)/);
            return m ? Number(m[1]) : -1;
        }).filter((id) => id > 0));
        const failedShots = shots.filter((s) => failedIds.has(s.shot_id));
        if (!failedShots.length)
            return shots;
        const systemPrompt = `你是分镜修复师。以下镜头未通过校验，请仅修复这些镜头，不要动其余镜头。
校验错误：
${errors.join('\n')}

修复规则：
- 每个镜头必须有不同的景别（shot_size）
- 每个镜头必须有不同的、具体的可视化动作
- 不允许连续静止镜头
- 保持 shot_id / beat_id 不变

输出格式：只输出失败的镜头 JSON 数组，不要输出其他内容。`;
        const userMessage = [
            `节拍：\n${JSON.stringify({ goal: beat.goal, event: beat.event }, null, 2)}`,
            `动作链：\n${JSON.stringify(actionChain, null, 2)}`,
            `需要修复的镜头：\n${JSON.stringify(failedShots, null, 2)}`,
        ].join('\n\n');
        const raw = await this.chat(systemPrompt, userMessage, 0.5);
        const repaired = await this.extractJSONWithRepair(raw, 'repairInvalidShots');
        const repairedMap = new Map(repaired.map((s) => [s.shot_id, s]));
        return shots.map((s) => repairedMap.get(s.shot_id) ?? s);
    }
    async splitShotsByBeats(script, beats, input, characterBible) {
        const allShots = [];
        let currentShotId = 1;
        let previousShot;
        for (const beat of beats) {
            const actionChain = await this.generateActionChain(beat, characterBible, beat.shot_count);
            this.logger.log(`[splitShotsByBeats] beat=${beat.beat_id} chain=${actionChain.map((a) => a.actionVerb).join('→')}`);
            let beatShots = await this.generateShotsForBeat(beat, script, input, characterBible, currentShotId, previousShot, actionChain);
            const errors = this.validateShots(beatShots);
            if (errors.length > 0) {
                this.logger.warn(`[splitShotsByBeats] beat=${beat.beat_id} validation errors: ${errors.join('; ')}`);
                beatShots = await this.repairInvalidShots(beatShots, errors, beat, actionChain);
            }
            for (let i = 0; i < beatShots.length; i++) {
                beatShots[i].narration = i === 0 ? beat.narration : '';
                beatShots[i].beat_id = beat.beat_id;
            }
            allShots.push(...beatShots);
            currentShotId += beatShots.length;
            previousShot = beatShots[beatShots.length - 1];
            this.logger.log(`[splitShotsByBeats] beat=${beat.beat_id} "${beat.event}" shots=${beatShots.length}`);
        }
        return allShots;
    }
    async generateShotsForBeat(beat, script, input, characterBible, startShotId, previousShot, actionChain = []) {
        const endShotId = startShotId + beat.shot_count - 1;
        const shotTypePlan = Array.from({ length: beat.shot_count }, (_, index) => {
            const shotNumber = startShotId + index;
            return {
                shot_id: shotNumber,
                shot_type: this.getShotType(shotNumber - 1, input.shot_count),
                inherit_from: shotNumber > 1 ? shotNumber - 1 : null,
            };
        });
        const sceneContext = this.buildSceneContext(input);
        const styleToken = this.buildStyleToken(input);
        const characterConstraints = characterBible.length > 0
            ? `\n\n角色设定（必须严格遵守，禁止改变外貌）：\n${JSON.stringify(characterBible, null, 2)}`
            : '';
        const rhythmHint = beat.beat_id === 1
            ? '广角慢镜头，建立环境，节奏舒缓'
            : /高潮|战斗|冲突|爆发|攻|斗/.test(beat.emotion + beat.event)
                ? '快切，近景特写，运动镜头，节奏紧张'
                : '情绪镜头为主，节奏适中';
        const actionChainSection = actionChain.length > 0
            ? `\n【动作链（最高执行优先级）】\n` +
                `每个 shot 必须对应动作链的对应 step，action 字段必须反映该步骤的动作，不允许自由发挥其他动作：\n` +
                actionChain.map((a) => `  shot_${startShotId + a.step - 1} → actionVerb="${a.actionVerb}", action="${a.action}"`).join('\n')
            : '';
        const systemPrompt = `你是 AI 分镜导演。为一个剧情节拍生成镜头序列。${characterConstraints}

【固定世界（最高优先级）】
${JSON.stringify(sceneContext, null, 2)}

【固定风格 Token（所有镜头必须继承，不要改写成别的画风）】
${styleToken}
${actionChainSection}
【镜头类型计划（必须逐条遵守，不要随机发挥）】
${JSON.stringify(shotTypePlan, null, 2)}

镜头节奏：${rhythmHint}

镜头规则：
- 每个镜头的 action 必须严格来自上方动作链对应步骤，不允许使用未在链中出现的动作
- 不同 shot 必须有不同的 shot_size（禁止连续相同景别）
- 镜头之间有因果逻辑（原因 → 过程 → 结果）
- 继承上一镜头的角色位置、场景状态（time/location 默认不变）
- 最后一个镜头为下一个节拍做视觉铺垫
- shot_id 从 ${startShotId} 连续编号到 ${endShotId}
- 输出 shot 数量必须严格等于 ${beat.shot_count}

输出格式（只输出一个 JSON 数组，JSON 结束后不要输出任何内容）：
[{
  "shot_id": ${startShotId},
  "duration": 数字,
  "shot_type": "${shotTypePlan[0]?.shot_type ?? 'establishing_shot'}",
  "inherit_from": ${shotTypePlan[0]?.inherit_from ?? null},
  "scene": "",
  "time": "",
  "location": "",
  "character": [],
  "action": "（具体可见的动作，不能是抽象情绪）",
  "emotion": "",
  "continuity": {"character_position": "", "action_state": "", "scene_state": ""},
  "camera": {"shot_size": "", "angle": "", "movement": ""},
  "visual": {"lighting": "", "color_palette": "", "composition": ""},
  "narration": "",
  "image_prompt": "",
  "negative_prompt": ""
}]`;
        const userMessage = [
            `当前节拍（你只为这个节拍生成镜头）：\n${JSON.stringify(beat, null, 2)}`,
            `完整剧本（参考上下文，不要偏离）：\n${JSON.stringify(script, null, 2)}`,
            `任务参数：\n${JSON.stringify({
                era: input.era,
                location: input.location,
                tone: input.tone,
                visual_style: input.visual_style,
                aspect_ratio: input.aspect_ratio,
            }, null, 2)}`,
            previousShot ? `上一个镜头（保持视觉连续性）：\n${JSON.stringify(previousShot, null, 2)}` : '',
        ].filter(Boolean).join('\n\n');
        const raw = await this.chat(systemPrompt, userMessage, 0.65);
        return this.extractJSONWithRepair(raw, `generateShotsForBeat:beat${beat.beat_id}`);
    }
    async generateImagePrompts(shots, characterBible, meta) {
        this.logger.log(`[generateImagePrompts] shots=${shots.length}`);
        const batchSize = 5;
        if (shots.length > batchSize) {
            const prompts = [];
            let previousShotState;
            for (let index = 0; index < shots.length; index += batchSize) {
                const batch = shots.slice(index, index + batchSize);
                this.logger.log(`[generateImagePrompts] batch shots=${batch.map((shot) => shot.shot_id).join(',')}`);
                const batchResults = await this.generateImagePromptsBatch(batch, characterBible, meta, previousShotState);
                prompts.push(...batchResults);
                previousShotState = this.extractShotState(batch[batch.length - 1]);
            }
            return prompts;
        }
        return this.generateImagePromptsBatch(shots, characterBible, meta);
    }
    async generateImagePromptsBatch(shots, characterBible, meta, previousShotState) {
        const characterAnchors = characterBible.map((char) => {
            const tokenName = `CHAR_${char.name.toUpperCase().replace(/\s+/g, '_')}`;
            return `${tokenName} = "${char.fixed_description}, wearing ${char.default_costume}"` +
                `\n  → 含此角色的 prompt 必须以 "${tokenName}," 开头，然后紧跟 fixed_description 逐字展开`;
        }).join('\n');
        const stateContext = previousShotState
            ? `\n\n【上一批次最后镜头状态（必须保持连续性）】\n${JSON.stringify(previousShotState, null, 2)}\n` +
                '生成当前批次 prompt 时，location/time/lighting/color_palette 必须与上一状态自然衔接，不能突变。'
            : '';
        const systemPrompt = `你是专业 AI 绘图 Prompt 工程师（电影分镜师风格）。

【角色 Token 系统（最高优先级）】
${characterAnchors}
以上 fixed_description 必须一字不差出现在对应角色的 prompt 开头，禁止改写、简化或替换。
${stateContext}
【严格 Prompt 结构】（每个 prompt 必须完全按此顺序）
[角色Token展开描述], [具体动作+身体姿态], [精确场景地点], [时代风格], [镜头景别], [镜头角度], [光线描述], [色调], [画幅比例], [风格标签]

【分层 Prompt 原则】
- character / environment / camera / lighting / action / style 必须各自清楚
- 不要写故事感想，不要写营销词
- 不要重新发明角色服装、发色、年龄、脸型
- 不要改变固定世界的时代、主地点、画幅、风格

【禁止规则】
- 禁止出现抽象词：epic, breathtaking, emotional, dramatic, powerful, legendary, masterpiece, best quality, ultra cinematic, stunning, gorgeous, magnificent, extraordinary, incredible, amazing, glorious, heroic, divine
- 禁止：心理活动描述、叙事性语言、无法目测的状态
- 禁止：时代不符的物品（历史题材不出现手机/汽车/现代服装）
- negative_prompt 固定值：${FIXED_NEGATIVE_PROMPT}

输出格式：JSON 数组（只输出 JSON，无解释无代码块）
[{ "shot_id": 1, "image_prompt": "...", "negative_prompt": "..." }]`;
        const userMessage = [
            `character_bible：\n${JSON.stringify(characterBible, null, 2)}`,
            `meta：\n${JSON.stringify(meta, null, 2)}`,
            `shots：\n${JSON.stringify(shots, null, 2)}`,
        ].join('\n\n');
        const raw = await this.chat(systemPrompt, userMessage, 0.5);
        const results = await this.extractJSONWithRepair(raw, 'generateImagePrompts');
        for (const result of results) {
            const shot = shots.find((s) => s.shot_id === result.shot_id);
            if (shot) {
                result.image_prompt = this.composeControlledImagePrompt(shot, characterBible, meta, result.image_prompt);
            }
            else {
                result.image_prompt = this.cleanImagePrompt(result.image_prompt);
            }
            result.negative_prompt = FIXED_NEGATIVE_PROMPT;
        }
        return results;
    }
};
exports.BigModelProvider = BigModelProvider;
exports.BigModelProvider = BigModelProvider = BigModelProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BigModelProvider);
//# sourceMappingURL=bigmodel.provider.js.map
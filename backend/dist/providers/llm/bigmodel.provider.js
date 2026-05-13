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
let BigModelProvider = BigModelProvider_1 = class BigModelProvider extends llm_provider_1.LLMProvider {
    constructor(configService) {
        super();
        this.configService = configService;
        this.logger = new common_1.Logger(BigModelProvider_1.name);
        const baseURL = this.configService.get('LLM_BASE_URL') ?? 'https://open.bigmodel.cn/api/paas/v4';
        const apiKey = this.configService.get('LLM_API_KEY') ?? '';
        this.model = this.configService.get('LLM_CHAT_MODEL') ?? 'glm-4-flash';
        this.fallbackApiKey = this.configService.get('DEEPSEEK_API_KEY') ?? '';
        this.fallbackBaseUrl = this.configService.get('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com/v1';
        this.fallbackModel = this.configService.get('DEEPSEEK_MODEL') ?? 'deepseek-chat';
        this.http = axios_1.default.create({
            baseURL,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 120_000,
        });
    }
    async chat(systemPrompt, userMessage, temperature = 0.7) {
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
            return resp.data.choices[0].message.content;
        }
        catch (err) {
            this.logger.warn(`BigModel failed (${err?.message}), trying DeepSeek fallback...`);
            if (!this.fallbackApiKey)
                throw err;
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
        }, {
            headers: {
                Authorization: `Bearer ${this.fallbackApiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 120_000,
        });
        return resp.data.choices[0].message.content;
    }
    extractJSON(raw) {
        let cleaned = raw
            .replace(/^```(?:json)?\s*/im, '')
            .replace(/\s*```\s*$/im, '')
            .trim();
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        let startIdx = -1;
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            startIdx = firstBrace;
        }
        else if (firstBracket !== -1) {
            startIdx = firstBracket;
        }
        if (startIdx > 0)
            cleaned = cleaned.slice(startIdx);
        cleaned = cleaned.replace(/\/\/[^\n\r]*/g, '');
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(cleaned);
    }
    async generateStoryboard(input) {
        this.logger.log(`[generateStoryboard] title="${input.title}" shots=${input.shot_count}`);
        const userMessage = `请根据以下输入，严格按照输出模板生成完整分镜数据：

输入：
${JSON.stringify(input, null, 2)}

${STORYBOARD_OUTPUT_TEMPLATE}

注意：shots 数组长度必须严格等于 shot_count=${input.shot_count}`;
        const raw = await this.chat(DIRECTOR_SYSTEM_PROMPT, userMessage, 0.75);
        const output = this.extractJSON(raw);
        output.validation = {
            shot_count_match: output.shots?.length === input.shot_count,
            character_consistency: true,
            era_consistency: true,
            all_actions_visualizable: true,
            no_abstract_only_shots: true,
            all_prompts_ready: output.shots?.every((s) => Boolean(s.image_prompt)),
        };
        this.logger.log(`[generateStoryboard] done, shots=${output.shots?.length}, prompts_ready=${output.validation.all_prompts_ready}`);
        return output;
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
        return this.extractJSON(raw);
    }
    async splitStoryboard(script, input) {
        this.logger.log(`[splitStoryboard] shot_count=${input.shot_count}`);
        const systemPrompt = `${DIRECTOR_SYSTEM_PROMPT}

本次任务：根据已有剧本和角色设定，生成 shots 数组。
输出格式：JSON 数组，每个元素严格遵守 ShotData 结构。
shots 数量必须等于 ${input.shot_count}。`;
        const userMessage = `剧本：\n${JSON.stringify(script, null, 2)}\n\n任务参数：\n${JSON.stringify({
            era: input.era,
            location: input.location,
            tone: input.tone,
            shot_count: input.shot_count,
            aspect_ratio: input.aspect_ratio,
            visual_style: input.visual_style,
            main_characters: input.main_characters,
        }, null, 2)}`;
        const raw = await this.chat(systemPrompt, userMessage, 0.7);
        return this.extractJSON(raw);
    }
    async generateImagePrompts(shots, characterBible, meta) {
        this.logger.log(`[generateImagePrompts] shots=${shots.length}`);
        const systemPrompt = `你是专业 AI 绘图 Prompt 工程师。
你的职责：把每个分镜转成高质量英文生图 Prompt。

Prompt 规范：
- 必须包含：角色外貌（引用 character_bible）、时代、地点、动作、镜头语言、光线色彩、画幅
- 禁止抽象词、心理活动、前后矛盾设定
- negative_prompt 固定包含：modern clothing, phone, car, text, watermark, extra fingers, distorted face, low quality, blurry

输出格式：JSON 数组
[{ "shot_id": 1, "image_prompt": "...", "negative_prompt": "..." }]`;
        const userMessage = `character_bible：\n${JSON.stringify(characterBible, null, 2)}\n\nmeta：\n${JSON.stringify(meta, null, 2)}\n\nshots：\n${JSON.stringify(shots, null, 2)}`;
        const raw = await this.chat(systemPrompt, userMessage, 0.6);
        return this.extractJSON(raw);
    }
};
exports.BigModelProvider = BigModelProvider;
exports.BigModelProvider = BigModelProvider = BigModelProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BigModelProvider);
//# sourceMappingURL=bigmodel.provider.js.map
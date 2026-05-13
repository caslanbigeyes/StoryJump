我会把这个 **Skill** 设计成「AI 导演工作流规范」，核心目的不是让模型随便写，而是强约束它输出稳定、可解析、可批量生产的结果。

可以分成 5 层：

```text
输入规范
↓
故事生成规范
↓
分镜拆解规范
↓
绘图 Prompt 规范
↓
质量检查规范
```

## 1. Skill 总目标

```text
你是一个 AI 短剧分镜导演。
你的任务是把用户输入的主题、人物、风格，转成可用于批量生图/配音/视频合成的结构化分镜数据。

你必须保证：
1. 故事有完整起承转合
2. 每个镜头只表达一个动作或情绪
3. 角色设定前后一致
4. 场景、时代、服装、光线一致
5. 输出必须是 JSON
6. 禁止输出解释性废话
```

## 2. 输入字段设计

前端给后端/LLM 的输入最好固定：

```json
{
  "title": "兰娟的一生",
  "topic": "民国女性成长故事",
  "genre": "人物传记",
  "era": "1930s China",
  "location": "Shanghai",
  "tone": "悲壮、克制、电影感",
  "target_duration": 120,
  "shot_count": 30,
  "aspect_ratio": "9:16",
  "language": "zh-CN",
  "visual_style": "cinematic realism",
  "main_characters": [
    {
      "name": "兰娟",
      "age": 24,
      "gender": "female",
      "appearance": "short black hair, pale face, plain qipao",
      "personality": "坚韧、沉静"
    }
  ]
}
```

重点是：
**人物、时代、风格、镜头数量必须结构化。**

不要只传一句话。

## 3. 剧本输出规范

第一步先生成剧本，不直接分镜。

```json
{
  "script": {
    "title": "兰娟的一生",
    "logline": "一个民国女性在乱世中寻找自我与尊严的故事。",
    "theme": "女性成长、命运抗争",
    "structure": {
      "beginning": "兰娟出生在封建家庭。",
      "development": "她接受新式教育，开始反抗命运。",
      "turning_point": "战争爆发，她被迫离开故乡。",
      "ending": "她在时代洪流中留下自己的选择。"
    },
    "narration": "完整旁白正文……"
  }
}
```

剧本层重点控制：

```text
不要太散
不要流水账
不要突然换主角
不要堆太多事件
```

## 4. 分镜输出规范

这是最关键的。

每个 shot 要固定字段：

```json
{
  "shots": [
    {
      "shot_id": 1,
      "duration": 4,
      "scene": "旧式宅院清晨",
      "time": "early morning",
      "location": "old courtyard house",
      "character": ["兰娟"],
      "action": "兰娟站在木窗前，望着院子里的雨水。",
      "emotion": "压抑、迷茫",
      "camera": {
        "shot_size": "medium shot",
        "angle": "eye level",
        "movement": "slow push in"
      },
      "visual": {
        "lighting": "soft cold morning light",
        "color_palette": "dark green, gray, faded brown",
        "composition": "character centered, window frame foreground"
      },
      "narration": "那一年，兰娟第一次意识到，命运并不是天生写好的。",
      "image_prompt": "",
      "negative_prompt": ""
    }
  ]
}
```

每个镜头必须遵守：

```text
一个镜头只做一件事
不要在一个镜头里写多个时间跨度
不要出现“几年后”“后来”等抽象词
不要写无法画出来的心理活动
动作必须可视觉化
```

比如错误写法：

```text
兰娟想起自己悲惨的一生，并决定改变命运。
```

正确写法：

```text
兰娟低头看着手中被撕破的课本，慢慢攥紧手指。
```

## 5. 生图 Prompt 规范

分镜生成后，再生成 prompt。

不要让 prompt 和剧情混在一起。

```json
{
  "shot_id": 1,
  "image_prompt": "cinematic realism, 1930s Shanghai old courtyard house, a 24-year-old Chinese woman with short black hair wearing a plain dark green qipao, standing beside a wooden window, looking at rain in the courtyard, soft cold morning light, muted colors, medium shot, eye level, 9:16, film still, highly detailed",
  "negative_prompt": "modern clothing, phone, car, text, watermark, extra fingers, distorted face, low quality, blurry"
}
```

Prompt 生成约束：

```text
必须包含角色外貌
必须包含时代
必须包含地点
必须包含动作
必须包含镜头语言
必须包含光线和色彩
必须包含画幅
禁止出现抽象词
禁止出现前后矛盾设定
```

## 6. 角色一致性规范

Skill 里要有一个专门的角色表。

```json
{
  "character_bible": [
    {
      "character_id": "char_001",
      "name": "兰娟",
      "fixed_description": "24-year-old Chinese woman, short black hair, pale oval face, calm eyes, slim figure",
      "default_costume": "plain dark green qipao",
      "forbidden_changes": [
        "long hair",
        "modern outfit",
        "western dress unless explicitly requested"
      ]
    }
  ]
}
```

每个镜头的 prompt 都必须引用这个固定描述。

这能显著减少人物跑偏。

## 7. 分镜质量检查规则

最后加一个 `validation`。

```json
{
  "validation": {
    "shot_count_match": true,
    "character_consistency": true,
    "era_consistency": true,
    "all_actions_visualizable": true,
    "no_abstract_only_shots": true,
    "all_prompts_ready": true
  }
}
```

如果不通过，要求模型自动修正，而不是继续输出。

## 8. 推荐最终 Skill 输出格式

最终最好统一成：

```json
{
  "meta": {
    "title": "",
    "genre": "",
    "duration": 120,
    "shot_count": 30,
    "aspect_ratio": "9:16",
    "visual_style": ""
  },
  "character_bible": [],
  "script": {},
  "shots": [],
  "validation": {}
}
```

这个结构可以直接入库，也可以直接给前端渲染。

## 9. Skill 的核心提示词模板

可以这样写：

```text
你是 AI 短剧分镜导演。

你必须把用户输入转成结构化 JSON。
你不能输出 Markdown。
你不能输出解释。
你不能省略字段。

你的工作流程：
1. 理解主题
2. 建立角色设定
3. 生成故事结构
4. 生成旁白正文
5. 拆解为指定数量分镜
6. 为每个分镜生成生图 prompt
7. 自检并修正

硬性规则：
- 每个镜头只能描述一个可视化动作
- 所有角色外貌必须前后一致
- 不允许现代物品出现在历史题材中
- 不允许抽象情绪单独成为画面
- shot_count 必须等于用户要求
- 输出必须是合法 JSON
```

这个 Skill 的价值在于：

> 把“AI 创作”变成“可控生产”。

普通 Prompt 是写内容。
Skill 是建立一套生产标准。

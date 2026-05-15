你技术上要加一层：**分镜规划器 Shot Planner**。
不要让 LLM 直接从「故事」生成「prompt」。

改成：

```text
故事概要
↓
Beat Planner 剧情节拍
↓
Action Chain 动作链
↓
Shot Planner 分镜规划
↓
Prompt Builder 拼接提示词
↓
Validator 校验重复/静态/不连续
↓
生图/视频
```

## 1. 数据库先改结构

核心不是存 `prompt`，而是存“动作状态”。

```ts
// shot 表建议字段
{
  id: string
  taskId: string
  beatId: string
  shotIndex: number

  // 剧情目的
  beatGoal: string

  // 镜头动作
  actionVerb: string        // draw_sword / sprint / slash / fall
  actionDetail: string      // 李白从雨中冲向魔种
  previousState: object
  currentState: object
  nextState: object

  // 镜头语言
  shotSize: string          // wide / medium / closeup
  cameraAngle: string       // low_angle / eye_level
  cameraMove: string        // push_in / pan / handheld

  // 文案
  narration: string

  // prompt
  imagePrompt: string
  negativePrompt: string

  status: string
}
```

关键字段是：

```text
actionVerb
previousState
currentState
nextState
```

没有这几个，你就很容易生成一堆站桩图。

## 2. 先生成 Beat，不要直接生成分镜

1 分钟视频建议 6 个 beat：

```json
[
  {
    "beat_id": "b01",
    "duration": 8,
    "goal": "建立危机",
    "event": "魔种冲破长安城门",
    "emotion": "压迫"
  },
  {
    "beat_id": "b02",
    "duration": 8,
    "goal": "英雄登场",
    "event": "李白出现在雨夜长街",
    "emotion": "希望"
  },
  {
    "beat_id": "b03",
    "duration": 12,
    "goal": "第一次交锋",
    "event": "李白冲向魔种但被震退",
    "emotion": "紧张"
  },
  {
    "beat_id": "b04",
    "duration": 12,
    "goal": "队友加入",
    "event": "花木兰和铠加入战斗",
    "emotion": "高燃"
  },
  {
    "beat_id": "b05",
    "duration": 14,
    "goal": "最终反击",
    "event": "三人合力击败魔种首领",
    "emotion": "爆发"
  },
  {
    "beat_id": "b06",
    "duration": 6,
    "goal": "结尾释放",
    "event": "黎明照进长安",
    "emotion": "释然"
  }
]
```

## 3. 每个 Beat 再生成 Action Chain

例如 `b03 第一次交锋`：

```json
[
  {
    "step": 1,
    "actionVerb": "lower_body_prepare",
    "action": "李白压低身体，右手握住剑柄"
  },
  {
    "step": 2,
    "actionVerb": "dash_forward",
    "action": "李白踏碎积水，向魔种高速冲刺"
  },
  {
    "step": 3,
    "actionVerb": "jump_slash",
    "action": "李白跃起，剑光斜斩向魔种胸口"
  },
  {
    "step": 4,
    "actionVerb": "impact_blocked",
    "action": "魔种抬起巨爪挡住剑光，火星炸开"
  },
  {
    "step": 5,
    "actionVerb": "knockback",
    "action": "李白被冲击波震退，落地滑行"
  }
]
```

这个动作链要先生成。
后面的 shot 只能从 action chain 里取动作，不允许自由发挥。

## 4. Prompt 不让 LLM 随便写，改成模板拼接

不要让模型输出一整段 prompt。
你在代码里拼：

```ts
function buildImagePrompt(shot, character, scene, style) {
  return [
    style.globalStyle,
    character.corePrompt,
    scene.corePrompt,
    shot.actionDetail,
    shot.shotSize,
    shot.cameraAngle,
    shot.cameraMove,
    shot.lighting,
    "9:16",
    "cinematic film still"
  ].join(", ");
}
```

这样每个 prompt 都稳定。

## 5. 加重复校验 Validator

生成完 shot 后跑一次校验。

```ts
function validateShots(shots) {
  const errors = [];

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];

    if (!shot.actionVerb) {
      errors.push(`shot_${i + 1}: missing actionVerb`);
    }

    if (i > 0 && shot.actionVerb === shots[i - 1].actionVerb) {
      errors.push(`shot_${i + 1}: repeated actionVerb`);
    }

    if (i > 0 && shot.shotSize === shots[i - 1].shotSize) {
      errors.push(`shot_${i + 1}: repeated shotSize`);
    }

    if (
      ["stand", "pose", "look"].includes(shot.actionVerb) &&
      i > 0 &&
      ["stand", "pose", "look"].includes(shots[i - 1].actionVerb)
    ) {
      errors.push(`shot_${i + 1}: consecutive static shots`);
    }
  }

  return errors;
}
```

如果失败：

```text
把错误列表发回 LLM，让它只修复失败的 shot。
```

## 6. 后端任务流改成这样

```text
createTask
↓
generateScript
↓
generateBeats
↓
generateActionChains
↓
generateShots
↓
validateShots
↓
buildPrompts
↓
generateImages
↓
generateVoiceByBeat
↓
composeVideo
```

BullMQ 队列可以拆：

```ts
await queue.add("generate-beats", { taskId });
await queue.add("generate-action-chains", { taskId });
await queue.add("generate-shots", { taskId });
await queue.add("validate-shots", { taskId });
await queue.add("build-prompts", { taskId });
```

## 7. 配音也要改

不要每个分镜都用同一句。
改成：

```text
每个 Beat 一句旁白
每个 Shot 可以为空旁白
```

例如：

```json
{
  "beat_id": "b03",
  "narration": "剑光划破雨夜，却没能撼动魔种的巨爪。",
  "shots": [6, 7, 8, 9]
}
```

这样视频不会每张图都重复念。

## 8. 最小改动优先级

你现在先做这 4 个就行：

```text
1. 加 Beat 表
2. 加 actionVerb 字段
3. Prompt 改成模板拼接
4. 加 Validator 禁止重复动作
```

这四个改完，效果会立刻比现在稳定很多。


最终我想要的效果： 因为你现在的系统，大概率还停留在：

```text id="c3h19z"
“主题驱动生图”
```

而不是：

```text id="8mxjko"
“动作驱动叙事”
```

所以模型会不断重复：

```text id="7u7y4f"
李白站着
李白挥剑
李白回头
李白看火焰
```

因为在 AI 看来：

```text id="wbdttm"
这些都属于“王者荣耀史诗战斗”
```

模型并不知道：

```text id="w80w1l"
角色现在应该干什么
```

---

# 真正原因（核心）

你现在的 Shot 数据里：

## 没有“动作状态变化”

例如你现在可能是：

```json id="d5u5bb"
{
  "scene": "长安大战",
  "character": "李白",
  "emotion": "热血"
}
```

这会导致：

```text id="phj73q"
所有镜头都长差不多
```

因为：

## 缺少：

# Action Progression（动作推进）

---

# 电影镜头真正依赖的是：

```text id="9bvr1s"
角色状态变化
```

例如：

```text id="qu9jru"
发现敌人
↓
拔剑
↓
冲刺
↓
跳跃
↓
挥剑
↓
落地
↓
喘息
```

每个镜头必须：

> 改变角色状态。

否则：

```text id="b8pxgs"
镜头永远静止
```

---

# 你现在的镜头可能是：

## 错误示例

```text id="krpppg"
shot1:
李白站在火焰前

shot2:
李白站在街道中央

shot3:
李白举起剑

shot4:
李白在雨中
```

看起来：

```text id="rywn0h"
像 4 张海报
```

不是故事。

---

# 正确应该是：

## Action Chain（动作链）

```text id="9qksvy"
shot1:
李白听见远处爆炸声，缓缓抬头

shot2:
手握剑柄

shot3:
剑出鞘特写

shot4:
快速冲向敌人

shot5:
跃起挥剑

shot6:
剑气击中魔种

shot7:
落地半跪喘息
```

注意：

## 每个镜头都在“改变世界”

这才会有：

```text id="r18s5s"
连续叙事感
```

---

# 你现在 AI 为什么偷懒？

因为：

## LLM 默认最喜欢：

```text id="c4am26"
“稳定复读”
```

它会不断重复：

```text id="g8t00w"
heroic pose
epic battle
standing
fire
```

因为这些是高概率词。

所以：

# 不能让 AI 自由发挥镜头

必须：

## 你先定义：

# 动作状态机

---

# 正确的数据结构

例如：

```json id="2c5nqq"
{
  "character_state": {
    "position": "street center",
    "weapon": "sheathed",
    "emotion": "focused",
    "movement": "idle"
  }
}
```

下一个镜头：

```json id="vw6fr5"
{
  "inherits": "shot_01",
  "movement": "draw_sword"
}
```

再下一个：

```json id="s2o9xj"
{
  "inherits": "shot_02",
  "movement": "sprint_forward"
}
```

---

# 这才是 AI 分镜真正核心：

# State Transition（状态迁移）

不是：

```text id="s0x9rn"
不断生成帅图
```

---

# 为什么你的动作会一样？

因为：

## 你现在每个镜头：

都是重新生成。

例如：

```text id="9p5cf4"
Generate 王者荣耀镜头
```

AI 每次都会：

```text id="zjlwmn"
重新随机
```

所以：

```text id="4mt8bo"
动作重复
姿势重复
构图重复
```

---

# 正确方式：

# 镜头继承

例如：

```json id="w2r0pk"
{
  "shot_02": {
    "continue_from": "shot_01"
  }
}
```

然后：

```text id="3j4az0"
动作必须延续
```

例如：

```text id="yv31ye"
上一镜头：
抬手

下一镜头：
挥剑

下一镜头：
击中
```

---

# 你现在缺少：

# Beat Goal（镜头目标）

例如：

```json id="9mff8x"
{
  "beat": "第一次交锋",
  "goal": "展示李白速度",
  "required_action": [
    "dash",
    "jump",
    "slash"
  ]
}
```

然后：

AI 才能：

```text id="u9fryb"
围绕动作生成镜头
```

---

# 你现在应该立刻做的优化

## 1. 禁止“静态镜头”连续出现

例如：

```text id="ktb1ub"
连续两个 standing shot
```

直接判失败。

---

## 2. 每个镜头必须包含 Action Verb

例如：

```text id="e4m3wp"
run
jump
turn
slash
fall
grab
look back
draw sword
```

没有动作词：

直接重生成。

---

## 3. 镜头必须继承前一个状态

例如：

```text id="y4n6po"
上一镜头：
李白拔剑

下一镜头：
不能又站着
```

---

## 4. 建立 Shot Progression Rule

例如：

```text id="4t4vkg"
观察
↓
准备
↓
行动
↓
冲突
↓
结果
```

镜头必须按节奏推进。

---

# 最关键一句话

你现在生成的是：

```text id="gwj2yx"
“角色主题海报”
```

不是：

```text id="j4hzr2"
“角色行为电影”
```

真正的电影感来自：

# “动作变化”

而不是：

```text id="4xmpqy"
角色站在不同地方
```

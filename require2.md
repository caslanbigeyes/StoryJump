不是单纯“技术不行”，而是你现在踩到了 AI 分镜产品里最核心的一个坑：

> “文本生成能力” ≠ “镜头连续叙事能力”

你现在的问题，其实是整个 AI 视频行业都在解决的东西。

你描述的现象：

```text
人物不一致
镜头跳
动作断裂
风格漂移
prompt 很怪
像随机拼图
```

这不是偶发。

而是因为：

```text
你现在的流程：
故事
→ 分镜
→ prompt
→ 生图
→ 拼视频
```

本质上还是：

> “独立图片流水线”

而不是：

> “真正的导演系统”

---

你现在最大的问题，大概率有 6 个。

# 一、你现在的 Prompt 太“文学化”

这是最大的问题。

很多人会写：

```text
李白愤怒地冲向敌人，
他的内心充满信念，
长安在火焰中燃烧。
```

但 AI 生图根本理解不了：

```text
信念
愤怒
守护
热血
史诗
```

这些都是抽象词。

模型真正能理解的是：

```text
人物长什么样
站在哪
镜头多远
什么动作
什么光
什么构图
```

所以：

## 错误 Prompt

```text
李白守护长安，与魔种展开史诗大战
```

## 正确 Prompt

```text
young chinese swordsman,
long white ponytail,
cyan robe,
standing in burning ancient chinese street,
holding glowing sword,
rainy night,
orange fire lighting,
cinematic low angle shot,
motion blur,
film still,
9:16
```

区别非常大。

---

# 二、你没有“角色圣经（Character Bible）”

这个是 AI 分镜产品的核心。

你现在可能每个镜头都重新描述：

```text
李白
```

但模型每次都会重新随机生成。

于是：

```text
第1镜头像李白
第2镜头像古装男模
第3镜头像仙侠NPC
第4镜头头发颜色变了
```

所以必须：

# 固定角色 Token

例如：

```text
Character_LB:
young chinese male,
long white ponytail,
sharp eyebrows,
cyan hanfu robe,
slim face,
glowing cyan sword
```

之后：

每个镜头都必须引用同一份角色描述。

不是“李白”。

而是：

```text
Character_LB running in rain
Character_LB close-up
Character_LB fighting monster
```

这才会稳定。

---

# 三、你的“镜头语言”可能完全没控制

很多 AI 分镜系统其实没有镜头概念。

但电影感本质上来自：

```text
景别
机位
运动
节奏
```

比如：

## 连续镜头应该：

```text
远景
→ 中景
→ 特写
→ 动作爆发
```

而不是：

```text
第一镜头俯拍
第二镜头上帝视角
第三镜头广角
第四镜头人物消失
```

所以你需要：

# Shot Schema

```json
{
  "shot_size": "close-up",
  "camera_angle": "low angle",
  "camera_move": "slow push in",
  "lens": "85mm",
  "motion": "running"
}
```

这东西非常关键。

---

# 四、你现在是“图拼视频”

不是“视频生成”。

这区别巨大。

你现在：

```text
图1
图2
图3
```

拼接。

于是：

```text
人物瞬移
动作断裂
场景变化
```

用户会觉得：

> PPT。

而真正电影感来自：

```text
前后镜头有动作延续
```

比如：

```text
镜头1：
李白拔剑

镜头2：
剑刚挥出去

镜头3：
敌人被斩开
```

这是“动作连续性”。

AI 最难的就是这个。

---

# 五、你的 Prompt 太长

很多人会写：

```text
masterpiece,best quality,epic,breathtaking,
ultra cinematic,
emotional atmosphere,
high detail,
...
```

然后一大堆。

结果：

模型注意力崩了。

真正有效的是：

```text
角色
+ 动作
+ 场景
+ 镜头
+ 光线
```

不要文学废话。

---

# 六、你的 Workflow 缺少“导演层”

这个是最大的本质问题。

你现在可能：

```text
LLM
直接输出 prompt
```

这是不够的。

真正需要：

# Director Layer

也就是：

```text
故事层
↓
导演层（镜头规划）
↓
分镜层
↓
Prompt层
↓
生图层
```

导演层负责：

```text
镜头节奏
人物调度
动作连续
场景延续
情绪推进
```

而不是直接生成 prompt。

---

# 你现在其实缺的是：

## “镜头状态机”

例如：

```json
{
  "scene_state": {
    "location": "长安街",
    "time": "night",
    "weather": "rain",
    "fire_level": 70
  },
  "character_state": {
    "LB": {
      "position": "street center",
      "emotion": "focused",
      "weapon": "drawn",
      "injured": false
    }
  }
}
```

每个镜头不是重新开始。

而是：

> 基于上一个镜头状态继续。

这才会连贯。

---

# 为什么 Storybound 这种工具效果好？

因为它们大概率做了：

## 1. 固定角色 embedding

不是普通 prompt。

---

## 2. 镜头规划器

不是 LLM 直接输出。

---

## 3. Prompt 后处理器

会清洗垃圾 prompt。

---

## 4. 连续镜头约束

例如：

```text
shot_02 must continue shot_01
```

---

## 5. 场景继承

不会每个镜头换世界。

---

# 你现在应该怎么优化（最重要）

## 第一阶段（最关键）

不要做：

```text
AI 自动导演
```

先做：

# 半自动导演

也就是：

用户控制：

```text
人物
场景
镜头节奏
```

AI 负责：

```text
细化 prompt
批量生成
```

效果会立刻提升。

---

# 你真正要做的 MVP

应该是：

```text
固定角色
+ 固定世界观
+ 固定风格
+ 半自动镜头
```

而不是：

```text
一句话自动生成电影
```

后者现在全行业都没真正解决。

---

# 最后一句最关键

你现在的问题：

不是“模型不够强”。

而是：

> “缺少电影语言层”。

绝大多数 AI 视频产品，
其实都停留在：

```text
文本 → 图片
```

但真正电影化需要：

```text
故事
→ 导演
→ 摄影
→ 灯光
→ 场景连续性
→ 动作连续性
→ 角色一致性
```

你现在已经碰到这个行业最核心的门槛了。

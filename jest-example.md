## 王者荣耀 AI 剧本分镜测试案例（1分钟）

你这个可以直接拿去喂你的 AI 工作流测试。

---

# 基础输入

```json
{
  "title": "长安最后一战",
  "topic": "王者荣耀热血战斗短片",
  "genre": "东方幻想 / 热血 / 团队战斗",
  "era": "王者大陆·长安城",
  "location": "长安朱雀街",
  "tone": "燃、史诗感、电影级、紧张压迫",
  "target_duration": 60,
  "shot_count": 16,
  "aspect_ratio": "9:16",
  "language": "zh-CN",
  "visual_style": "cinematic realism + fantasy game art"
}
```

---

# 主题（Theme）

```text
在长安城沦陷前夜，几位英雄为了守护最后的百姓，与魔种大军展开最后一战。
```

---

# 关键词（Keywords）

```text
王者荣耀
长安城
东方幻想
史诗战斗
魔种入侵
热血
团队作战
电影感
技能特效
高燃
雨夜
火焰
守护
牺牲
英雄集结
```

---

# 故事概要（Story Summary）

```text
魔种大军突袭长安城，整座城市陷入火海。

百姓四散奔逃，城门即将失守。

就在所有人绝望之际，
李白、花木兰、铠三人出现在朱雀街。

他们必须拖住魔种首领，
为城内百姓撤离争取最后一分钟。

暴雨落下，
长街燃烧，
刀光与剑气撕裂黑夜。

最终，
花木兰重伤守住城门，
李白以“青莲剑歌”斩开魔潮，
铠开启魔铠完成最后一击。

黎明即将到来，
长安城的钟声重新响起。
```

---

# 人物设定（Character Bible）

```json
[
  {
    "name": "李白",
    "role": "主战输出",
    "appearance": "白色长发，高马尾，青色长袍，手持长剑",
    "personality": "洒脱、自信、剑术极强",
    "combat_style": "高速剑气、残影位移"
  },
  {
    "name": "花木兰",
    "role": "前线守卫",
    "appearance": "短发，红黑轻甲，重剑",
    "personality": "坚毅、冷静、责任感强",
    "combat_style": "近战爆发、重剑斩击"
  },
  {
    "name": "铠",
    "role": "最终决战",
    "appearance": "银白铠甲，蓝色能量纹路，巨刃",
    "personality": "沉默、压迫感强",
    "combat_style": "魔铠强化、重型近战"
  },
  {
    "name": "魔种首领",
    "role": "Boss",
    "appearance": "巨大黑色怪物，红色双眼，燃烧黑炎",
    "personality": "残暴、压迫感",
    "combat_style": "巨力冲击、黑炎攻击"
  }
]
```

---

# 风格（Style Guide）

```text
整体风格：
东方幻想 + 王者荣耀CG电影感

画面风格：
电影级光影
强烈火焰与雨夜对比
大量粒子特效
高动态战斗镜头

色调：
深蓝、黑金、火焰橙红

镜头语言：
快速推拉
慢动作斩击
大量低机位英雄镜头
广角大战场

音乐风格：
史诗交响乐 + 鼓点 + 女声吟唱

节奏：
前20秒压迫
中段高燃战斗
最后10秒情绪释放
```

---

# 分镜节奏建议（1分钟）

## 第一幕（0-15秒）

```text
长安城陷入火海
百姓逃亡
魔种冲破城门
压迫感建立
```

---

## 第二幕（15-45秒）

```text
李白登场
花木兰正面迎敌
铠从火焰中出现
三人联手大战魔种
技能特效爆发
```

---

## 第三幕（45-60秒）

```text
最终技能连招
李白剑气贯穿夜空
铠终结Boss
长安钟声响起
黎明出现
```

---

# AI 生图风格关键词（可直接测试）

```text
cinematic realism,
Honor of Kings style,
ancient Chinese fantasy city,
rainy night,
burning street,
epic battle,
magic particles,
dramatic lighting,
film still,
high detail,
dynamic action pose,
9:16,
Unreal Engine cinematic,
dark blue and orange color palette
```

---

# 推荐测试你的完整流程

你现在可以直接测：

```text
输入主题
↓
AI生成故事
↓
AI拆16个分镜
↓
生成每个镜头prompt
↓
批量生图
↓
生成旁白
↓
生成配音
↓
导出视频
```

这个案例的优点：

* 人物明确
* 场景统一
* 风格强烈
* 容易出效果
* 非常适合测试镜头连续性
* 很适合验证角色一致性
* AI 生图容易“高燃”

尤其适合你现在做 MVP。

可以。你这个产品本质是：

> 微信小程序版「AI 剧本 → 分镜 → 生图 → 配音 → 视频草稿」流水线工具。

推荐整体框架如下：

```text
微信小程序 / H5
        ↓
uni-app 前端
        ↓
Node.js 后端 API
        ↓
任务队列 / Worker
        ↓
LLM / 生图 / TTS / 视频合成服务
        ↓
数据库 + 对象存储
```

## 一、前端：uni-app

前端主要负责展示和交互，不要把 AI 逻辑放前端。

核心页面可以这样拆：

```text
登录页
任务列表页
新建任务页
任务详情页
文案编辑页
分镜预览页
图片生成页
配音试听页
导出页
```

任务详情页是核心，类似你截图里的流程面板：

```text
1. 文案撰写
2. 智能改写
3. 分镜拆解
4. 生成绘图提示词
5. 批量生图
6. TTS 配音
7. 生成视频草稿
```

前端技术建议：

```text
uni-app + Vue3 + Pinia + TypeScript
```

UI 可以用：

```text
uView Plus / uni-ui / Wot Design Uni
```

小程序端注意一点：
**微信小程序不适合长连接和大文件处理**，所以任务状态要用轮询或者 WebSocket。

简单点先用轮询：

```text
每 2 秒请求一次任务状态
GET /api/tasks/:id/status
```

## 二、后端：Node.js

后端建议不要只写一个普通 Express 服务，最好分成：

```text
API Server
Worker Server
```

### API Server

负责：

```text
用户登录
创建任务
查询任务
保存文案
返回分镜结果
返回图片地址
扣费/额度
```

技术选型：

```text
NestJS / Fastify / Express
```

我更推荐 **NestJS**，因为后期模块会比较多。

模块可以这样分：

```text
AuthModule          用户登录
UserModule          用户信息
TaskModule          任务管理
ScriptModule        文案生成
StoryboardModule    分镜生成
ImageModule         生图
TtsModule           配音
VideoModule         视频导出
BillingModule       额度/计费
StorageModule       文件存储
```

### Worker Server

负责真正耗时的 AI 任务。

比如：

```text
生成文案
拆分镜
批量生图
TTS 配音
合成视频
```

为什么要 Worker？

因为这些任务可能要几十秒甚至几分钟，不能让接口一直等。

正确流程是：

```text
用户点击生成
↓
后端创建任务
↓
放入队列
↓
立即返回 taskId
↓
Worker 后台慢慢处理
↓
前端轮询任务进度
```

## 三、任务队列

这是这个产品的核心。

推荐：

```text
Redis + BullMQ
```

任务流程示例：

```text
create_script_job
        ↓
split_storyboard_job
        ↓
generate_prompt_job
        ↓
generate_images_job
        ↓
generate_tts_job
        ↓
generate_video_job
```

每一步都要记录状态：

```text
pending    等待中
running    进行中
success    成功
failed     失败
```

数据库里可以存：

```text
task_id
user_id
current_step
progress
status
error_message
created_at
updated_at
```

## 四、数据库设计

推荐：

```text
PostgreSQL + Prisma
```

核心表大概是：

```text
users
tasks
scripts
storyboards
shots
assets
usage_records
```

### task 表

存一个任务整体信息：

```text
id
user_id
title
status
current_step
progress
```

### shots 表

存每个分镜：

```text
id
task_id
shot_index
scene_text
camera_angle
character_action
image_prompt
image_url
status
```

### assets 表

存图片、音频、视频：

```text
id
task_id
shot_id
type: image/audio/video
url
provider
```

## 五、文件存储

图片、音频、视频不要存在服务器本地。

推荐：

```text
腾讯云 COS
阿里云 OSS
七牛云
Cloudflare R2
```

小程序在国内用的话，腾讯云 COS 更顺。

流程：

```text
AI 生成图片
↓
后端下载图片
↓
上传到 COS
↓
数据库保存 COS 地址
↓
前端展示
```

## 六、AI 能力层

可以抽象成几个 Provider：

```text
LLMProvider
ImageProvider
TTSProvider
VideoProvider
```

这样后期可以自由切换模型。

比如：

```text
LLM：
OpenAI / Claude / 通义千问 / DeepSeek / 豆包

生图：
Midjourney API / Stable Diffusion / Flux / 即梦 / 可灵

TTS：
火山引擎 / Azure TTS / ElevenLabs / 阿里云 TTS

视频：
FFmpeg / 剪映草稿 / 可灵 / Runway / Pika
```

后端不要写死某一个模型，应该这样封装：

```text
await llm.generateScript()
await llm.splitStoryboard()
await image.generateShotImage()
await tts.generateVoice()
await video.compose()
```

## 七、整体请求流程

用户新建任务：

```text
前端提交主题
↓
POST /api/tasks
↓
后端创建任务
↓
写入数据库
↓
加入 BullMQ 队列
↓
返回 taskId
```

Worker 执行：

```text
1. 生成故事文案
2. 拆成 20-50 个分镜
3. 为每个分镜生成 prompt
4. 批量调用生图接口
5. 生成配音
6. 合成视频或导出草稿
```

前端展示：

```text
GET /api/tasks/:id
GET /api/tasks/:id/shots
GET /api/tasks/:id/assets
```

## 八、MVP 最小版本建议

不要一开始做完整视频合成。

第一版先做：

```text
输入主题
↓
生成故事文案
↓
自动拆分镜
↓
生成每个镜头 prompt
↓
批量生图
↓
前端分镜预览
```

也就是先做成：

> AI 分镜图生成工具

等这个跑通，再加：

```text
TTS 配音
视频合成
剪映草稿导出
团队协作
模板市场
```

## 九、推荐技术栈

```text
前端：
uni-app + Vue3 + TypeScript + Pinia

后端：
Node.js + NestJS + Prisma

数据库：
PostgreSQL

队列：
Redis + BullMQ

存储：
腾讯云 COS

AI：
DeepSeek / 通义 / OpenAI + 生图模型 + TTS

部署：
Docker + 宝塔 / 腾讯云轻量 / Railway / Fly.io
```

核心重点不是 uni-app，也不是 Node。

真正难点是：

> 任务队列 + 分镜数据结构 + AI 工作流编排 + 失败重试。

如果这四个做好，这个工具就能跑起来。
# StoryJump

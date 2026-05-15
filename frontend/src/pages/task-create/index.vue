<template>
  <div class="page">
    <header class="topbar">
      <div>
        <div class="eyebrow">AI 剧本分镜工具</div>
        <h1 class="title">灵感输入</h1>
      </div>
      <button class="ghost-btn" @click="fillExample">示例</button>
    </header>

    <main class="content">
      <section class="panel primary-panel">
        <div class="section-head">
          <span class="section-index">1</span>
          <div>
            <h2 class="section-title">创作基础</h2>
            <p class="section-subtitle">把主题、风格和目标时长交给 AI，后续会自动生成剧本、分镜和画面。</p>
          </div>
        </div>

        <div class="grid two-cols">
          <label class="field">
            <span class="label">任务标题</span>
            <input v-model="form.title" class="input" placeholder="例如：王者荣耀英雄成长短片" />
          </label>

          <label class="field">
            <span class="label">主题 / 关键词</span>
            <input v-model="form.topic" class="input" placeholder="例如：坚韧、成长、希望" />
          </label>
        </div>

        <label class="field">
          <span class="label">故事梗概</span>
          <textarea
            v-model="storySummary"
            class="textarea"
            placeholder="描述你想讲的故事、主要冲突、情绪走向或结尾。"
          />
        </label>
      </section>

      <section class="panel">
        <div class="section-head compact">
          <span class="section-index">2</span>
          <h2 class="section-title">人物设定</h2>
        </div>

        <div class="character-grid">
          <label class="field">
            <span class="label">姓名</span>
            <input v-model="character.name" class="input" placeholder="主角名" />
          </label>
          <label class="field">
            <span class="label">年龄</span>
            <input v-model.number="character.age" class="input" type="number" min="1" max="120" />
          </label>
          <label class="field">
            <span class="label">性别</span>
            <select v-model="character.gender" class="select">
              <option value="unspecified">不限</option>
              <option value="female">女性</option>
              <option value="male">男性</option>
            </select>
          </label>
          <label class="field wide">
            <span class="label">外貌 / 身份</span>
            <input v-model="character.appearance" class="input" placeholder="例如：年轻射手，银色披风，眼神坚定" />
          </label>
          <label class="field wide">
            <span class="label">性格</span>
            <input v-model="character.personality" class="input" placeholder="例如：沉稳、倔强、有保护欲" />
          </label>
        </div>
      </section>

      <section class="panel">
        <div class="section-head compact">
          <span class="section-index">3</span>
          <h2 class="section-title">风格与规格</h2>
        </div>

        <div class="grid three-cols">
          <label class="field">
            <span class="label">类型</span>
            <select v-model="form.genre" class="select">
              <option value="game-cinematic">游戏剧情</option>
              <option value="commercial">品牌短片</option>
              <option value="documentary">纪实叙事</option>
              <option value="fantasy">奇幻冒险</option>
              <option value="general">通用故事</option>
            </select>
          </label>
          <label class="field">
            <span class="label">时代</span>
            <select v-model="form.era" class="select">
              <option value="contemporary">现代</option>
              <option value="ancient">古风</option>
              <option value="future">未来</option>
              <option value="fantasy">架空</option>
            </select>
          </label>
          <label class="field">
            <span class="label">场景地点</span>
            <input v-model="form.location" class="input" placeholder="例如：峡谷战场" />
          </label>
          <label class="field">
            <span class="label">情绪基调</span>
            <select v-model="form.tone" class="select">
              <option value="热血、史诗、电影感">热血史诗</option>
              <option value="温暖、真实、治愈">温暖治愈</option>
              <option value="悬疑、压迫、反转">悬疑反转</option>
              <option value="轻松、幽默、明快">轻松幽默</option>
            </select>
          </label>
          <label class="field">
            <span class="label">视觉风格</span>
            <select v-model="form.visual_style" class="select">
              <option value="cinematic realism">电影写实</option>
              <option value="anime key visual">动画海报</option>
              <option value="fantasy concept art">幻想概念设定</option>
              <option value="3d game cinematic">3D 游戏动画</option>
            </select>
          </label>
          <label class="field">
            <span class="label">画面比例</span>
            <select v-model="form.aspect_ratio" class="select">
              <option value="9:16">9:16 竖屏</option>
              <option value="16:9">16:9 横屏</option>
              <option value="1:1">1:1 方图</option>
              <option value="4:3">4:3</option>
            </select>
          </label>
          <label class="field">
            <span class="label">目标时长</span>
            <input v-model.number="form.target_duration" class="input" type="number" min="15" max="600" />
          </label>
          <label class="field">
            <span class="label">分镜数量</span>
            <input v-model.number="form.shot_count" class="input" type="number" min="5" max="100" />
          </label>
          <label class="field">
            <span class="label">语言</span>
            <select v-model="form.language" class="select">
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </label>
        </div>
      </section>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <section class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">预计输出</span>
          <strong>{{ form.shot_count }} 个分镜 / {{ form.target_duration }} 秒</strong>
        </div>
        <button class="btn-primary" :disabled="loading" @click="handleCreate">
          {{ loading ? '创建中...' : '开始创作' }}
        </button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { createTask } from '../../api/task.api';

const form = reactive({
  title: '',
  topic: '',
  genre: 'game-cinematic',
  era: 'contemporary',
  location: '',
  tone: '热血、史诗、电影感',
  target_duration: 120,
  shot_count: 20,
  aspect_ratio: '9:16',
  language: 'zh-CN',
  visual_style: '3d game cinematic',
});

const character = reactive({
  name: '',
  age: 18,
  gender: 'unspecified',
  appearance: '',
  personality: '',
});

const storySummary = ref('');
const loading = ref(false);
const errorMsg = ref('');

const normalizedTopic = computed(() => {
  const parts = [form.topic.trim(), storySummary.value.trim()].filter(Boolean);
  return parts.join('\n\n故事梗概：');
});

function fillExample() {
  form.title = '王者荣耀英雄成长短片';
  form.topic = '坚韧、成长、守护、荣耀';
  form.location = '峡谷边境与破晓战场';
  storySummary.value = '一位年轻英雄在失败后重新集结伙伴，穿过风暴中的峡谷，在最后一战中完成自我突破。';
  character.name = '曜';
  character.age = 19;
  character.gender = 'male';
  character.appearance = '少年剑客，蓝白战甲，披风破损但眼神明亮';
  character.personality = '自信、热血、偶尔冲动，但关键时刻可靠';
}

async function handleCreate() {
  if (loading.value) return;
  if (!form.title.trim() || !normalizedTopic.value.trim()) {
    errorMsg.value = '请填写任务标题和视频主题';
    return;
  }

  loading.value = true;
  errorMsg.value = '';
  try {
    const mainCharacters = character.name.trim()
      ? [{
          name: character.name.trim(),
          age: Number(character.age) || 18,
          gender: character.gender,
          appearance: character.appearance.trim() || 'unspecified',
          personality: character.personality.trim() || 'unspecified',
        }]
      : [];

    const result = await createTask({
      title: form.title.trim(),
      topic: normalizedTopic.value,
      genre: form.genre,
      era: form.era,
      location: form.location.trim() || 'unspecified',
      tone: form.tone,
      target_duration: Number(form.target_duration) || 120,
      shot_count: Number(form.shot_count) || 20,
      aspect_ratio: form.aspect_ratio,
      language: form.language,
      visual_style: form.visual_style,
      main_characters: mainCharacters,
    });
    uni.redirectTo({ url: `/pages/task-detail/index?taskId=${result.taskId}` });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '创建失败，请重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f6f9fd; color: #17233d; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 28px 32px 18px; background: linear-gradient(180deg, #ffffff 0%, #eef7ff 100%); border-bottom: 1px solid #d8e8f8; }
.eyebrow { font-size: 14px; color: #3974d8; font-weight: 700; }
.title { margin: 4px 0 0; font-size: 34px; line-height: 1.2; }
.ghost-btn { border: 1px solid #b9d8f5; color: #2668c9; background: #fff; border-radius: 8px; padding: 10px 16px; font-size: 15px; }
.content { padding: 24px 32px 32px; max-width: 1120px; margin: 0 auto; }
.panel { background: #fff; border: 1px solid #d9e8f6; border-radius: 8px; padding: 22px; margin-bottom: 18px; box-shadow: 0 10px 26px rgba(34, 92, 150, 0.06); }
.primary-panel { border-color: #b8e4df; }
.section-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
.section-head.compact { align-items: center; margin-bottom: 16px; }
.section-index { width: 32px; height: 32px; border-radius: 50%; background: #1aa99a; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
.section-title { margin: 0; font-size: 21px; }
.section-subtitle { margin: 5px 0 0; color: #69788f; font-size: 14px; line-height: 1.5; }
.grid { display: grid; gap: 16px; }
.two-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.three-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.character-grid { display: grid; grid-template-columns: 1fr 120px 150px; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.field.wide { grid-column: span 3; }
.label { color: #52637b; font-size: 14px; font-weight: 700; }
.input, .textarea, .select { width: 100%; box-sizing: border-box; border: 1px solid #cddcf0; border-radius: 8px; background: #fbfdff; color: #17233d; font-size: 15px; outline: none; padding: 13px 14px; }
.textarea { min-height: 116px; resize: vertical; line-height: 1.55; }
.input:focus, .textarea:focus, .select:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12); }
.summary-bar { display: flex; align-items: center; justify-content: space-between; gap: 18px; background: #ffffff; border: 1px solid #d9e8f6; border-radius: 8px; padding: 18px 22px; position: sticky; bottom: 0; }
.summary-item { display: flex; flex-direction: column; gap: 4px; }
.summary-label { font-size: 13px; color: #69788f; }
.btn-primary { min-width: 220px; background: #276fe6; color: #fff; border-radius: 8px; padding: 16px 24px; font-size: 18px; border: none; font-weight: 800; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.error-msg { color: #c62828; background: #ffebee; border-radius: 8px; padding: 12px 16px; margin: 0 0 18px; }
@media (max-width: 820px) {
  .topbar { padding: 22px 18px 16px; }
  .content { padding: 18px; }
  .two-cols, .three-cols, .character-grid { grid-template-columns: 1fr; }
  .field.wide { grid-column: auto; }
  .summary-bar { align-items: stretch; flex-direction: column; }
  .btn-primary { width: 100%; min-width: 0; }
}
</style>

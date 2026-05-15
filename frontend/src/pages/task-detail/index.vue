<template>
  <div class="page">
    <header class="header">
      <div>
        <div class="eyebrow">AI 创作流水线</div>
        <h1 class="title">{{ taskStore.currentTask?.title ?? '任务详情' }}</h1>
      </div>
      <div class="progress-pill">{{ pollingProgress }}%</div>
    </header>

    <div v-if="pageError" class="page-error">{{ pageError }}</div>
    <div v-else-if="pollingError" class="page-error">{{ pollingError }}</div>
    <div v-else-if="pollingErrorMessage" class="page-error warning">{{ pollingErrorMessage }}</div>

    <section class="flow-strip">
      <div
        v-for="step in pipelineSteps"
        :key="step.id"
        :class="['flow-step', getStepStatus(step.step)]"
      >
        <div class="flow-icon">
          <span v-if="getStepStatus(step.step) === 'success'">✓</span>
          <span v-else-if="getStepStatus(step.step) === 'running'">⟳</span>
          <span v-else-if="getStepStatus(step.step) === 'failed'">!</span>
          <span v-else>{{ step.id }}</span>
        </div>
        <div class="flow-copy">
          <strong>{{ step.title }}</strong>
          <span>{{ step.summary }}</span>
        </div>
      </div>
    </section>

    <section class="detail-grid">
      <article
        v-for="step in pipelineSteps"
        :key="`card-${step.id}`"
        :class="['detail-card', getStepStatus(step.step)]"
      >
        <div class="card-title-row">
          <span class="card-index">{{ step.id }}</span>
          <h2>{{ step.title }}</h2>
        </div>
        <ul class="feature-list">
          <li v-for="item in step.items" :key="item">{{ item }}</li>
        </ul>
        <div class="card-status">{{ stepStatusLabel(getStepStatus(step.step)) }}</div>
      </article>
    </section>

    <section class="actions">
      <button class="btn-secondary" :disabled="!canOpenScript" @click="goScriptEdit">编辑剧本</button>
      <button class="btn-secondary" :disabled="!canOpenStoryboard" @click="goStoryboard">查看分镜</button>
      <button class="btn-primary" :disabled="!canOpenStoryboard" @click="goExport">导出视频</button>
      <button v-if="pollingStatus === TaskStatus.FAILED" class="btn-retry" @click="goBack">返回重试</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '../../stores/task.store';
import { useTaskPolling } from '../../composables/useTaskPolling';
import { TaskStep, TaskStatus } from '../../types/index';

interface PipelineStep {
  id: number;
  title: string;
  summary: string;
  step: TaskStep;
  items: string[];
}

const taskStore = useTaskStore();
const route = useRoute();
const router = useRouter();
const pageError = ref('');

const taskId = computed(() => String(route.query.taskId ?? ''));

const {
  status: pollingStatus,
  currentStep: pollingStep,
  progress: pollingProgress,
  error: pollingError,
  errorMessage: pollingErrorMessage,
  startPolling,
} = useTaskPolling(taskId.value);

const stepWeights: Record<TaskStep, number> = {
  [TaskStep.CREATE_SCRIPT]: 2,
  [TaskStep.SPLIT_STORYBOARD]: 3,
  [TaskStep.GENERATE_PROMPTS]: 4,
  [TaskStep.GENERATE_IMAGES]: 5,
  [TaskStep.GENERATE_TTS]: 6,
  [TaskStep.GENERATE_VIDEO]: 7,
  [TaskStep.DONE]: 8,
};

const pipelineSteps: PipelineStep[] = [
  {
    id: 1,
    title: '灵感输入',
    summary: '主题、人物、风格、时长',
    step: TaskStep.CREATE_SCRIPT,
    items: ['主题/关键词', '故事梗概', '人物设定', '风格与规格'],
  },
  {
    id: 2,
    title: 'AI 生成剧本',
    summary: '故事大纲与完整剧本',
    step: TaskStep.CREATE_SCRIPT,
    items: ['AI 生成故事大纲', '完整剧本', '分场剧情梗概', '角色台词'],
  },
  {
    id: 3,
    title: '分镜拆解',
    summary: '镜头脚本与运镜',
    step: TaskStep.SPLIT_STORYBOARD,
    items: ['智能镜头拆解', '镜头脚本生成', '景别/运镜设计', '时长分配'],
  },
  {
    id: 4,
    title: '生成画面',
    summary: '分镜图与画面一致性',
    step: TaskStep.GENERATE_IMAGES,
    items: ['AI 生成分镜图', '保持角色一致性', '场景细节还原', '多图备选'],
  },
  {
    id: 5,
    title: 'AI 配音',
    summary: '语音合成与试听',
    step: TaskStep.GENERATE_TTS,
    items: ['AI 语音合成', '多音色选择', '情感语调', '配音试听'],
  },
  {
    id: 6,
    title: '生成视频',
    summary: '自动剪辑合成',
    step: TaskStep.GENERATE_VIDEO,
    items: ['图片转场', '字幕生成', '视频合成', '预览校对'],
  },
  {
    id: 7,
    title: '导出与分享',
    summary: '下载、分享、二次编辑',
    step: TaskStep.DONE,
    items: ['下载视频', '分享链接', '二次编辑', '项目管理'],
  },
];

const canOpenScript = computed(() => pollingProgress.value >= 60 || pollingStatus.value === TaskStatus.SUCCESS);
const canOpenStoryboard = computed(() => pollingStatus.value === TaskStatus.SUCCESS || pollingProgress.value >= 60);

function getStepStatus(stepKey: TaskStep): 'pending' | 'running' | 'success' | 'failed' {
  if (pollingStatus.value === TaskStatus.FAILED && pollingStep.value === stepKey) return 'failed';
  if (pollingStatus.value === TaskStatus.SUCCESS) return 'success';

  const currentWeight = stepWeights[pollingStep.value] ?? 0;
  const stepWeight = stepWeights[stepKey] ?? 0;

  if (stepWeight < currentWeight) return 'success';
  if (stepWeight === currentWeight) return 'running';
  return 'pending';
}

function stepStatusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '进行中',
    success: '已完成',
    failed: '失败',
  };
  return map[s] ?? s;
}

function goStoryboard() {
  router.push({ path: '/pages/storyboard/index', query: { taskId: taskId.value } });
}

function goScriptEdit() {
  router.push({ path: '/pages/script-edit/index', query: { taskId: taskId.value } });
}

function goExport() {
  router.push({ path: '/pages/export/index', query: { taskId: taskId.value } });
}

function goBack() {
  uni.navigateBack();
}

onMounted(() => {
  if (!taskId.value) {
    pageError.value = '缺少任务 ID，无法查看详情';
    return;
  }

  taskStore.fetchTask(taskId.value)
    .catch((err: unknown) => {
      pageError.value = err instanceof Error ? err.message : '任务详情加载失败';
    })
    .finally(() => {
      if (!pageError.value) startPolling();
    });
});
</script>

<style scoped>
.page { min-height: 100vh; background: #f6f9fd; color: #17233d; padding-bottom: 32px; }
.header { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 28px 32px; background: linear-gradient(180deg, #ffffff 0%, #eef7ff 100%); border-bottom: 1px solid #d8e8f8; }
.eyebrow { font-size: 14px; color: #3974d8; font-weight: 800; }
.title { margin: 4px 0 0; font-size: 30px; line-height: 1.25; }
.progress-pill { min-width: 76px; text-align: center; background: #276fe6; color: #fff; border-radius: 999px; padding: 12px 16px; font-size: 22px; font-weight: 800; }
.page-error { margin: 22px 32px 0; background: #ffebee; color: #c62828; border-radius: 8px; padding: 14px 18px; }
.page-error.warning { background: #fff7e6; color: #a15c00; }
.flow-strip { margin: 24px 32px; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; }
.flow-step { background: #fff; border: 1px solid #d8e5f5; border-radius: 8px; padding: 14px 12px; min-height: 132px; display: flex; flex-direction: column; gap: 10px; }
.flow-step.running { border-color: #4f8df0; box-shadow: 0 8px 22px rgba(39, 111, 230, 0.12); }
.flow-step.success { border-color: #82d7c9; background: #f7fffd; }
.flow-step.failed { border-color: #ef9a9a; background: #fff7f7; }
.flow-icon { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #edf3fb; color: #5880b8; font-weight: 900; }
.running .flow-icon { background: #e5efff; color: #276fe6; }
.success .flow-icon { background: #dff8f2; color: #139b84; }
.failed .flow-icon { background: #ffebee; color: #d32f2f; }
.flow-copy { display: flex; flex-direction: column; gap: 5px; }
.flow-copy strong { font-size: 15px; }
.flow-copy span { color: #69788f; font-size: 12px; line-height: 1.4; }
.detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin: 0 32px; }
.detail-card { background: #fff; border: 1px solid #d9e8f6; border-radius: 8px; padding: 18px; }
.detail-card.running { border-color: #4f8df0; }
.detail-card.success { border-color: #82d7c9; }
.detail-card.failed { border-color: #ef9a9a; }
.card-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.card-title-row h2 { margin: 0; font-size: 18px; }
.card-index { width: 28px; height: 28px; border-radius: 50%; background: #276fe6; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
.feature-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.feature-list li { border: 1px solid #d9e8f6; border-radius: 8px; padding: 10px 12px; color: #32435c; background: #fbfdff; font-size: 14px; }
.card-status { margin-top: 16px; color: #276fe6; font-weight: 800; font-size: 14px; }
.actions { margin: 24px 32px 0; display: flex; gap: 12px; flex-wrap: wrap; }
.btn-secondary, .btn-primary, .btn-retry { border-radius: 8px; padding: 15px 22px; font-size: 16px; font-weight: 800; border: none; }
.btn-secondary { background: #fff; color: #276fe6; border: 1px solid #bad3fb; }
.btn-primary { background: #276fe6; color: #fff; }
.btn-retry { background: #d32f2f; color: #fff; }
.btn-secondary:disabled, .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
@media (max-width: 1100px) {
  .flow-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .header { align-items: flex-start; flex-direction: column; padding: 22px 18px; }
  .flow-strip, .detail-grid, .actions { margin-left: 18px; margin-right: 18px; }
  .flow-strip, .detail-grid { grid-template-columns: 1fr; }
  .actions { flex-direction: column; }
}
</style>

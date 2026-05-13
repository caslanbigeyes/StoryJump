<template>
  <div class="page">
    <div class="header">
      <span class="title">{{ taskStore.currentTask?.title ?? '任务详情' }}</span>
      <span class="progress-label">{{ pollingProgress }}%</span>
    </div>

    <div v-if="pageError" class="page-error">{{ pageError }}</div>
    <div v-else-if="pollingError" class="page-error">{{ pollingError }}</div>
    <div v-else-if="pollingErrorMessage" class="page-error warning">{{ pollingErrorMessage }}</div>

    <div class="pipeline">
      <div
        v-for="step in pipelineSteps"
        :key="step.key"
        :class="['step-item', getStepStatus(step.key)]"
      >
        <div class="step-icon">
          <span v-if="getStepStatus(step.key) === 'success'" class="icon-text">✓</span>
          <span v-else-if="getStepStatus(step.key) === 'running'" class="icon-text">⟳</span>
          <span v-else-if="getStepStatus(step.key) === 'failed'" class="icon-text">✗</span>
          <span v-else class="icon-text step-num">{{ step.index }}</span>
        </div>
        <div class="step-content">
          <span class="step-label">{{ step.label }}</span>
          <span class="step-status-text">{{ stepStatusLabel(getStepStatus(step.key)) }}</span>
        </div>
        <div v-if="getStepStatus(step.key) === 'running'" class="step-spinner" />
      </div>
    </div>

    <div class="actions">
      <button
        v-if="pollingStatus === 'success'"
        class="btn-secondary"
        @click="goScriptEdit"
      >
        编辑剧本
      </button>
      <button
        v-if="pollingStatus === 'success'"
        class="btn-primary"
        @click="goStoryboard"
      >
        查看分镜
      </button>
      <button
        v-if="pollingStatus === 'failed'"
        class="btn-retry"
        @click="goBack"
      >
        返回重试
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTaskStore } from '../../stores/task.store';
import { useTaskPolling } from '../../composables/useTaskPolling';
import { TaskStep, TaskStatus } from '../../types/index';

const taskStore = useTaskStore();
const route = useRoute();
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

const STEP_ORDER: TaskStep[] = [
  TaskStep.CREATE_SCRIPT,
  TaskStep.GENERATE_IMAGES,
  TaskStep.DONE,
];

const pipelineSteps = [
  { index: 1, key: TaskStep.CREATE_SCRIPT, label: '文案与分镜生成' },
  { index: 2, key: TaskStep.GENERATE_IMAGES, label: '批量生图' },
  { index: 3, key: TaskStep.DONE, label: '完成' },
];

function getStepStatus(stepKey: TaskStep): 'pending' | 'running' | 'success' | 'failed' {
  if (pollingStatus.value === TaskStatus.FAILED && pollingStep.value === stepKey) {
    return 'failed';
  }
  const currentIdx = STEP_ORDER.indexOf(pollingStep.value);
  const stepIdx = STEP_ORDER.indexOf(stepKey);

  if (stepIdx < currentIdx) return 'success';
  if (stepIdx === currentIdx) {
    return pollingStatus.value === TaskStatus.SUCCESS ? 'success' : 'running';
  }
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
  uni.navigateTo({ url: `/pages/storyboard/index?taskId=${taskId.value}` });
}

function goScriptEdit() {
  uni.navigateTo({ url: `/pages/script-edit/index?taskId=${taskId.value}` });
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
.page { min-height: 100vh; background: #f5f7fa; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 32px; background: #fff; gap: 16px; }
.title { font-size: 28px; font-weight: bold; flex: 1; }
.progress-label { font-size: 28px; font-weight: bold; color: #6c63ff; }
.page-error { margin: 24px; background: #ffebee; color: #c62828; border-radius: 16px; padding: 16px 20px; }
.page-error.warning { background: #fff7e6; color: #b26a00; }
.pipeline { margin: 24px; background: #fff; border-radius: 20px; padding: 24px; }
.step-item { display: flex; align-items: center; padding: 24px 0; border-bottom: 1px solid #f0f0f0; position: relative; }
.step-item:last-child { border-bottom: none; }
.step-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 20px; flex-shrink: 0; }
.step-item.pending .step-icon { background: #f0f0f0; }
.step-item.running .step-icon { background: #e3f2fd; }
.step-item.success .step-icon { background: #e8f5e9; }
.step-item.failed .step-icon { background: #ffebee; }
.icon-text { font-size: 24px; font-weight: bold; }
.step-item.pending .icon-text { color: #bbb; }
.step-item.running .icon-text { color: #2196f3; }
.step-item.success .icon-text { color: #4caf50; }
.step-item.failed .icon-text { color: #f44336; }
.step-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.step-label { font-size: 18px; color: #333; }
.step-item.pending .step-label { color: #bbb; }
.step-status-text { font-size: 14px; color: #999; }
.step-spinner { width: 28px; height: 28px; border: 3px solid #e3f2fd; border-top-color: #2196f3; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.actions { padding: 32px; display: flex; flex-direction: column; gap: 12px; }
.btn-secondary { width: 100%; background: #fff; color: #6c63ff; border-radius: 16px; padding: 18px 24px; font-size: 18px; border: 1px solid #c9c2ff; }
.btn-primary { width: 100%; background: #6c63ff; color: #fff; border-radius: 16px; padding: 18px 24px; font-size: 18px; border: none; }
.btn-retry { width: 100%; background: #f44336; color: #fff; border-radius: 16px; padding: 18px 24px; font-size: 18px; border: none; }
</style>

<template>
  <view class="page">
    <view class="header">
      <text class="title">{{ taskStore.currentTask?.title ?? '任务详情' }}</text>
      <text class="progress-label">{{ pollingProgress }}%</text>
    </view>

    <!-- 任务流程面板 -->
    <view class="pipeline">
      <view
        v-for="step in pipelineSteps"
        :key="step.key"
        :class="['step-item', getStepStatus(step.key)]"
      >
        <view class="step-icon">
          <text v-if="getStepStatus(step.key) === 'success'" class="icon-text">✓</text>
          <text v-else-if="getStepStatus(step.key) === 'running'" class="icon-text">⟳</text>
          <text v-else-if="getStepStatus(step.key) === 'failed'" class="icon-text">✗</text>
          <text v-else class="icon-text step-num">{{ step.index }}</text>
        </view>
        <view class="step-content">
          <text class="step-label">{{ step.label }}</text>
          <text class="step-status-text">{{ stepStatusLabel(getStepStatus(step.key)) }}</text>
        </view>
        <view v-if="getStepStatus(step.key) === 'running'" class="step-spinner" />
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button
        v-if="pollingStatus === 'success'"
        class="btn-primary"
        @tap="goStoryboard"
      >
        查看分镜
      </button>
      <button
        v-if="pollingStatus === 'failed'"
        class="btn-retry"
        @tap="goBack"
      >
        返回重试
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useTaskStore } from '../../stores/task.store';
import { useTaskPolling } from '../../composables/useTaskPolling';
import { TaskStep, TaskStatus } from '../../types/index';

const taskStore = useTaskStore();

// 从路由参数获取 taskId
const pages = getCurrentPages();
const currentPage = pages[pages.length - 1] as any;
const taskId: string = currentPage?.options?.taskId ?? '';

const { status: pollingStatus, currentStep: pollingStep, progress: pollingProgress, startPolling } =
  useTaskPolling(taskId);

const STEP_ORDER: TaskStep[] = [
  TaskStep.CREATE_SCRIPT,
  TaskStep.SPLIT_STORYBOARD,
  TaskStep.GENERATE_PROMPTS,
  TaskStep.GENERATE_IMAGES,
  TaskStep.GENERATE_TTS,
  TaskStep.GENERATE_VIDEO,
  TaskStep.DONE,
];

const pipelineSteps = [
  { index: 1, key: TaskStep.CREATE_SCRIPT,    label: '文案撰写' },
  { index: 2, key: TaskStep.SPLIT_STORYBOARD, label: '分镜拆解' },
  { index: 3, key: TaskStep.GENERATE_PROMPTS, label: '生成绘图提示词' },
  { index: 4, key: TaskStep.GENERATE_IMAGES,  label: '批量生图' },
  { index: 5, key: TaskStep.GENERATE_TTS,     label: 'TTS 配音' },
  { index: 6, key: TaskStep.GENERATE_VIDEO,   label: '合成视频' },
  { index: 7, key: TaskStep.DONE,             label: '导出完成' },
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
  uni.navigateTo({ url: `/pages/storyboard/index?taskId=${taskId}` });
}

function goBack() {
  uni.navigateBack();
}

onMounted(() => {
  if (taskId) {
    taskStore.fetchTask(taskId);
    startPolling();
  }
});
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f7fa; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 32rpx; background: #fff; }
.title { font-size: 36rpx; font-weight: bold; flex: 1; margin-right: 16rpx; }
.progress-label { font-size: 40rpx; font-weight: bold; color: #6c63ff; }
.pipeline { margin: 24rpx; background: #fff; border-radius: 20rpx; padding: 24rpx; }
.step-item { display: flex; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid #f0f0f0; position: relative; }
.step-item:last-child { border-bottom: none; }
.step-icon { width: 64rpx; height: 64rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 24rpx; flex-shrink: 0; }
.step-item.pending .step-icon { background: #f0f0f0; }
.step-item.running .step-icon { background: #e3f2fd; }
.step-item.success .step-icon { background: #e8f5e9; }
.step-item.failed .step-icon { background: #ffebee; }
.icon-text { font-size: 28rpx; font-weight: bold; }
.step-item.pending .icon-text { color: #bbb; }
.step-item.running .icon-text { color: #2196f3; }
.step-item.success .icon-text { color: #4caf50; }
.step-item.failed .icon-text { color: #f44336; }
.step-content { flex: 1; }
.step-label { font-size: 30rpx; color: #333; display: block; margin-bottom: 4rpx; }
.step-item.pending .step-label { color: #bbb; }
.step-status-text { font-size: 24rpx; color: #999; }
.step-spinner { width: 32rpx; height: 32rpx; border: 4rpx solid #e3f2fd; border-top-color: #2196f3; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.actions { padding: 32rpx; }
.btn-primary { width: 100%; background: #6c63ff; color: #fff; border-radius: 16rpx; padding: 32rpx; font-size: 32rpx; border: none; }
.btn-retry { width: 100%; background: #f44336; color: #fff; border-radius: 16rpx; padding: 32rpx; font-size: 32rpx; border: none; }
</style>

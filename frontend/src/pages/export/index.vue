<template>
  <div class="page">
    <div class="header">
      <div>
        <div class="title">导出视频</div>
        <div class="subtitle">将当前任务的分镜图片与配音合成为可预览视频</div>
      </div>
      <button class="btn-back" @click="handleBack">返回分镜</button>
    </div>

    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

    <div v-if="status === 'processing'" class="progress-card">
      <div class="progress-title">视频合成中</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }" />
      </div>
      <div class="progress-text">{{ progress }}%</div>
    </div>

    <div class="preview-section">
      <video
        v-if="videoUrl"
        class="video-player"
        :src="videoUrl"
        controls
        playsinline
      />
      <div v-else class="video-placeholder">
        <span class="placeholder-icon">▶</span>
        <span class="placeholder-text">导出后在这里预览视频</span>
      </div>
    </div>

    <div class="export-options">
      <label class="option-item">
        <span class="option-label">分辨率</span>
        <select v-model="resolution" class="select">
          <option v-for="item in resolutions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <label class="option-item">
        <span class="option-label">格式</span>
        <select v-model="format" class="select">
          <option v-for="item in formats" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </div>

    <div class="actions">
      <button class="btn-export" :disabled="exporting || status === 'processing' || !taskId" @click="handleExport">
        {{ exporting || status === 'processing' ? '合成中...' : '开始合成视频' }}
      </button>
      <a v-if="videoUrl" class="btn-download" :href="videoUrl" target="_blank" rel="noreferrer">打开视频链接</a>
    </div>

    <div v-if="videoUrl" class="result">
      <div class="result-label">导出完成</div>
      <div class="result-meta">
        <span>分辨率：{{ videoMeta.resolution || resolution }}</span>
        <span>格式：{{ videoMeta.format || format }}</span>
        <span>音频：{{ videoMeta.audioMode || 'unknown' }}</span>
      </div>
      <div class="result-url" @click="copyUrl">{{ videoUrl }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { exportTaskVideo, getTaskVideo, type TaskVideoStatus } from '../../api/task.api';

const route = useRoute();
const router = useRouter();
const taskId = String(route.query.taskId ?? '');

const resolutions = ['1080x1920', '720x1280', '540x960'];
const formats = ['MP4', 'MOV'];
const resolution = ref('1080x1920');
const format = ref('MP4');
const exporting = ref(false);
const errorMsg = ref('');
const videoUrl = ref('');
const status = ref<TaskVideoStatus['status']>('idle');
const progress = ref(0);
const videoMeta = ref<Partial<TaskVideoStatus>>({});
let pollTimer: number | null = null;

onMounted(async () => {
  if (!taskId) {
    errorMsg.value = '缺少任务 ID';
    return;
  }

  try {
    await refreshVideoStatus();
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '视频状态读取失败';
  }
});

onBeforeUnmount(() => {
  stopPolling();
});

async function handleExport() {
  if (!taskId || exporting.value) return;
  exporting.value = true;
  errorMsg.value = '';
  try {
    const result = await exportTaskVideo(taskId, {
      resolution: resolution.value,
      format: format.value,
    });
    status.value = result.status;
    progress.value = result.progress ?? 0;
    videoMeta.value = {
      ...videoMeta.value,
      resolution: result.resolution,
      format: result.format,
    };
    videoUrl.value = '';
    startPolling();
    uni.showToast({ title: '已开始合成', icon: 'success' });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '视频生成失败';
  } finally {
    exporting.value = false;
  }
}

function handleBack() {
  router.push({ path: '/pages/storyboard/index', query: { taskId } });
}

function copyUrl() {
  if (!videoUrl.value) return;
  uni.setClipboardData({ data: videoUrl.value });
}

async function refreshVideoStatus() {
  const current = await getTaskVideo(taskId);
  status.value = current.status;
  progress.value = current.progress ?? (current.status === 'ready' ? 100 : 0);
  videoMeta.value = current;
  if (current.resolution) resolution.value = current.resolution;
  if (current.format) format.value = current.format;

  if (current.status === 'ready' && current.videoUrl) {
    videoUrl.value = current.videoUrl;
    stopPolling();
    return;
  }

  if (current.status === 'failed') {
    errorMsg.value = current.errorMessage ?? '视频生成失败';
    videoUrl.value = '';
    stopPolling();
    return;
  }

  if (current.status === 'processing') {
    videoUrl.value = '';
    startPolling();
    return;
  }

  videoUrl.value = '';
}

function startPolling() {
  if (pollTimer !== null) return;
  pollTimer = window.setInterval(async () => {
    try {
      await refreshVideoStatus();
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : '视频状态读取失败';
      stopPolling();
    }
  }, 1500);
}

function stopPolling() {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f7fa; padding-bottom: 32px; }
.header { padding: 28px 32px; background: #fff; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.title { font-size: 30px; font-weight: 700; color: #1d2738; }
.subtitle { margin-top: 6px; font-size: 14px; color: #7a869a; }
.btn-back { background: #eef4ff; color: #235ad6; border: 1px solid #bfd2ff; border-radius: 12px; padding: 12px 18px; }
.error-msg { margin: 20px 24px 0; color: #c62828; }
.progress-card { margin: 20px 24px 0; background: #fff; border-radius: 20px; padding: 18px 20px; }
.progress-title { font-size: 16px; font-weight: 600; color: #1d2738; }
.progress-bar { margin-top: 12px; height: 10px; background: #edf1f7; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #6c63ff, #2aa7ff); border-radius: 999px; transition: width 0.3s ease; }
.progress-text { margin-top: 10px; font-size: 14px; color: #637085; }
.preview-section { margin: 24px; }
.video-player, .video-placeholder { width: 100%; border-radius: 24px; background: #111827; min-height: 420px; }
.video-player { display: block; }
.video-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.6); }
.placeholder-icon { font-size: 72px; line-height: 1; }
.placeholder-text { margin-top: 12px; font-size: 16px; }
.export-options { margin: 0 24px; background: #fff; border-radius: 24px; padding: 16px 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.option-item { display: flex; flex-direction: column; gap: 8px; }
.option-label { font-size: 14px; color: #637085; }
.select { border: 1px solid #d9dff0; border-radius: 12px; padding: 12px 14px; font-size: 15px; background: #fff; }
.actions { margin: 24px; display: flex; gap: 12px; }
.btn-export, .btn-download { flex: 1; text-align: center; padding: 18px 20px; border-radius: 16px; font-size: 16px; text-decoration: none; }
.btn-export { background: #6c63ff; color: #fff; border: none; }
.btn-download { background: #e8f5e9; color: #1b7b3a; border: 1px solid #bde1c7; }
.btn-export:disabled { opacity: 0.6; cursor: not-allowed; }
.result { margin: 0 24px; background: #fff; border-radius: 24px; padding: 20px 24px; }
.result-label { font-size: 18px; font-weight: 700; color: #1b7b3a; }
.result-meta { margin-top: 10px; display: flex; gap: 12px; flex-wrap: wrap; color: #637085; font-size: 14px; }
.result-url { margin-top: 12px; color: #235ad6; word-break: break-all; cursor: pointer; }
@media (max-width: 768px) {
  .header, .actions { flex-direction: column; align-items: stretch; }
  .export-options { grid-template-columns: 1fr; }
  .video-player, .video-placeholder { min-height: 300px; }
}
</style>

<template>
  <div class="page">
    <div class="header">
      <div class="header-meta">
        <span class="title">分镜列表</span>
        <span class="count">共 {{ shots.length }} 个分镜</span>
      </div>
      <div class="header-actions">
        <button class="btn-export-video" :disabled="loading || !taskId" @click="handleOpenExport">
          去导出视频
        </button>
        <button class="btn-batch-generate" :disabled="batchGenerating || loading || !taskId" @click="handleBatchGenerateImages">
          {{ batchGenerating ? '批量生图中...' : '保存全部并批量生图' }}
        </button>
        <button class="btn-batch-audio" :disabled="batchAudioGenerating || loading || !taskId" @click="handleBatchGenerateAudio">
          {{ batchAudioGenerating ? '批量配音中...' : '保存全部并批量配音' }}
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="shot-list">
      <div
        v-for="shot in shots"
        :key="shot.id"
        class="shot-card"
      >
        <div class="shot-index-bar">
          <span class="shot-index">第 {{ shot.shotIndex + 1 }} 镜</span>
          <div :class="['shot-status', `shot-status-${shot.status}`]">
            <span class="shot-status-text">{{ shot.status }}</span>
          </div>
        </div>

        <div class="shot-image-wrap">
          <img
            v-if="shot.imageUrl"
            :src="shot.imageUrl"
            class="shot-image"
          />
          <div v-else class="shot-image-placeholder">
            <span class="placeholder-text">图片生成中...</span>
          </div>
        </div>

        <div class="shot-info">
          <div class="info-row">
            <span class="info-label">场景描述</span>
            <textarea v-model="shot.sceneText" class="info-editor" />
          </div>
          <div class="info-row">
            <span class="info-label">镜头角度</span>
            <textarea v-model="shot.cameraAngle" class="info-editor compact" />
          </div>
          <div class="info-row">
            <span class="info-label">绘图提示词</span>
            <textarea v-model="shot.imagePrompt" class="info-editor prompt" />
          </div>
          <div class="info-row">
            <span class="info-label">角色动作</span>
            <textarea v-model="shot.characterAction" class="info-editor compact" />
          </div>
        </div>

        <div class="shot-actions">
          <button class="btn-regenerate-image" :disabled="busyShotId === shot.id" @click="handleRegenerateImage(shot.id)">
            {{ busyShotId === shot.id ? '处理中...' : '重生图片' }}
          </button>
          <button class="btn-regenerate-audio" :disabled="busyShotId === shot.id" @click="handleRegenerateAudio(shot.id)">
            {{ busyShotId === shot.id ? '处理中...' : '重配音' }}
          </button>
          <button class="btn-save-shot" :disabled="savingShotId === shot.id" @click="handleSaveShot(shot.id)">
            {{ savingShotId === shot.id ? '保存中...' : '保存镜头修改' }}
          </button>
        </div>

        <div v-if="shot.audioUrl" class="shot-audio">
          <button class="btn-play" @click="playAudio(shot.audioUrl!)">播放配音</button>
        </div>
      </div>

      <div v-if="shots.length === 0" class="empty">
        暂无分镜数据
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getShots, regenerateShotAudio, regenerateShotImage, regenerateTaskAudio, regenerateTaskImages, updateShot } from '../../api/task.api';
import type { Shot } from '../../types/index';

const shots = ref<Shot[]>([]);
const loading = ref(false);
const errorMsg = ref('');
const savingShotId = ref('');
const busyShotId = ref('');
const batchGenerating = ref(false);
const batchAudioGenerating = ref(false);
const route = useRoute();
const router = useRouter();

const taskId = String(route.query.taskId ?? '');

onMounted(async () => {
  if (!taskId) return;
  loading.value = true;
  try {
    shots.value = await getShots(taskId);
    errorMsg.value = '';
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '分镜加载失败';
  } finally {
    loading.value = false;
  }
});

async function handleSaveShot(shotId: string) {
  const shot = shots.value.find((item) => item.id === shotId);
  if (!shot || savingShotId.value) return;

  savingShotId.value = shotId;
  errorMsg.value = '';
  try {
    const result = await updateShot(shotId, {
      sceneText: shot.sceneText ?? '',
      cameraAngle: shot.cameraAngle ?? '',
      characterAction: shot.characterAction ?? '',
      imagePrompt: shot.imagePrompt ?? '',
    });
    const index = shots.value.findIndex((item) => item.id === shotId);
    if (index >= 0) shots.value[index] = result;
    uni.showToast({ title: '镜头已保存', icon: 'success' });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '镜头保存失败';
  } finally {
    savingShotId.value = '';
  }
}

async function saveAllShots() {
  const nextShots = await Promise.all(
    shots.value.map((shot) =>
      updateShot(shot.id, {
        sceneText: shot.sceneText ?? '',
        cameraAngle: shot.cameraAngle ?? '',
        characterAction: shot.characterAction ?? '',
        imagePrompt: shot.imagePrompt ?? '',
      }),
    ),
  );
  shots.value = nextShots;
}

async function handleRegenerateImage(shotId: string) {
  if (busyShotId.value) return;
  busyShotId.value = shotId;
  errorMsg.value = '';
  try {
    const { imageUrl } = await regenerateShotImage(shotId);
    const shot = shots.value.find((item) => item.id === shotId);
    if (shot) {
      shot.imageUrl = imageUrl;
      shot.status = 'image_done';
    }
    uni.showToast({ title: '图片已重生成', icon: 'success' });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '图片重生成失败';
  } finally {
    busyShotId.value = '';
  }
}

async function handleRegenerateAudio(shotId: string) {
  if (busyShotId.value) return;
  busyShotId.value = shotId;
  errorMsg.value = '';
  try {
    const { audioUrl } = await regenerateShotAudio(shotId);
    const shot = shots.value.find((item) => item.id === shotId);
    if (shot) {
      shot.audioUrl = audioUrl;
      shot.status = 'tts_done';
    }
    uni.showToast({ title: '配音已重生成', icon: 'success' });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '配音重生成失败';
  } finally {
    busyShotId.value = '';
  }
}

async function handleBatchGenerateImages() {
  if (!taskId || batchGenerating.value) return;
  batchGenerating.value = true;
  errorMsg.value = '';
  try {
    await saveAllShots();
    const result = await regenerateTaskImages(taskId);
    shots.value = await getShots(taskId);
    uni.showToast({
      title: result.failedCount > 0 ? `完成 ${result.successCount}/${result.total}` : '批量生图完成',
      icon: 'success',
    });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '批量生图失败';
  } finally {
    batchGenerating.value = false;
  }
}

async function handleBatchGenerateAudio() {
  if (!taskId || batchAudioGenerating.value) return;
  batchAudioGenerating.value = true;
  errorMsg.value = '';
  try {
    await saveAllShots();
    const result = await regenerateTaskAudio(taskId);
    shots.value = await getShots(taskId);
    uni.showToast({
      title: result.failedCount > 0 ? `完成 ${result.successCount}/${result.total}` : '批量配音完成',
      icon: 'success',
    });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '批量配音失败';
  } finally {
    batchAudioGenerating.value = false;
  }
}

function playAudio(url: string) {
  // TODO: 使用 uni.createInnerAudioContext 播放音频
  const audio = uni.createInnerAudioContext();
  audio.src = url;
  audio.play();
}

function handleOpenExport() {
  if (!taskId) return;
  router.push({ path: '/pages/export/index', query: { taskId } });
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f7fa; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 32px; background: #fff; gap: 16px; }
.header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.header-meta { display: flex; flex-direction: column; gap: 6px; }
.title { font-size: 28px; font-weight: bold; }
.count { font-size: 14px; color: #999; }
.btn-batch-generate { background: #166d58; color: #fff; border: none; border-radius: 14px; padding: 14px 20px; font-size: 15px; }
.btn-export-video { background: #eef4ff; color: #235ad6; border: 1px solid #bfd2ff; border-radius: 14px; padding: 14px 20px; font-size: 15px; }
.btn-batch-audio { background: #5a3fd1; color: #fff; border: none; border-radius: 14px; padding: 14px 20px; font-size: 15px; }
.loading { flex: 1; display: flex; align-items: center; justify-content: center; }
.shot-list { flex: 1; padding: 16px; overflow: auto; }
.shot-card { background: #fff; border-radius: 20px; margin-bottom: 24px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.shot-index-bar { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
.shot-index { font-size: 18px; font-weight: bold; color: #333; }
.shot-status { border-radius: 10px; padding: 4px 14px; background: #eee; }
.shot-status-text { font-size: 12px; color: #666; }
.shot-status-image_done { background: #e8f5e9; }
.shot-status-image_done .shot-status-text { color: #4caf50; }
.shot-status-image_failed { background: #ffebee; }
.shot-status-image_failed .shot-status-text { color: #f44336; }
.shot-image-wrap { width: 100%; height: 360px; background: #f0f0f0; }
.shot-image { width: 100%; height: 100%; }
.shot-image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.placeholder-text { font-size: 18px; color: #bbb; }
.shot-info { padding: 24px 32px; }
.info-row { display: flex; margin-bottom: 16px; gap: 16px; align-items: flex-start; }
.info-label { font-size: 15px; color: #999; width: 110px; flex-shrink: 0; }
.info-value { font-size: 15px; color: #333; flex: 1; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.info-value.prompt { color: #6c63ff; font-size: 14px; }
.info-editor { width: 100%; min-height: 84px; border: 1px solid #d9dff0; border-radius: 12px; padding: 10px 12px; font-size: 15px; line-height: 1.5; resize: vertical; }
.info-editor.compact { min-height: 60px; }
.info-editor.prompt { color: #6c63ff; font-size: 14px; }
.shot-actions { padding: 0 32px 20px; display: flex; gap: 10px; flex-wrap: wrap; }
.btn-save-shot { background: #eef4ff; color: #235ad6; border: 1px solid #bfd2ff; border-radius: 12px; padding: 12px 16px; font-size: 14px; }
.btn-regenerate-image { background: #fff6e8; color: #b46b00; border: 1px solid #f1cb8d; border-radius: 12px; padding: 12px 16px; font-size: 14px; }
.btn-regenerate-audio { background: #f2ecff; color: #6f42c1; border: 1px solid #d7c6ff; border-radius: 12px; padding: 12px 16px; font-size: 14px; }
.btn-save-shot:disabled, .btn-regenerate-image:disabled, .btn-regenerate-audio:disabled, .btn-batch-generate:disabled, .btn-batch-audio:disabled, .btn-export-video:disabled { opacity: 0.6; cursor: not-allowed; }
.shot-audio { padding: 0 32px 24px; }
.btn-play { background: #e3f2fd; color: #2196f3; border-radius: 12px; padding: 12px 16px; font-size: 15px; border: none; }
.empty { text-align: center; padding: 80px; color: #bbb; font-size: 18px; }
.error-msg { margin: 16px 24px 0; color: #c62828; }
</style>

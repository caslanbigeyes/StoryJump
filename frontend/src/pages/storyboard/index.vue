<template>
  <div class="page">
    <header class="header">
      <div>
        <div class="eyebrow">Storyboard Studio</div>
        <h1 class="title">分镜工作台</h1>
        <p class="subtitle">预览画面、微调镜头、试听配音，并进入视频合成。</p>
      </div>
      <div class="header-actions">
        <button class="btn quiet" :disabled="loading || !taskId" @click="reloadShots">刷新</button>
        <button class="btn accent" :disabled="batchGenerating || loading || !taskId" @click="handleBatchGenerateImages">
          {{ batchGenerating ? '生图中...' : '保存全部并批量生图' }}
        </button>
        <button class="btn purple" :disabled="batchAudioGenerating || loading || !taskId" @click="handleBatchGenerateAudio">
          {{ batchAudioGenerating ? '配音中...' : '保存全部并批量配音' }}
        </button>
        <button class="btn primary" :disabled="loading || !taskId" @click="handleOpenExport">导出视频</button>
      </div>
    </header>

    <div class="stats-bar">
      <div class="stat-item">
        <span>总分镜</span>
        <strong>{{ shots.length }}</strong>
      </div>
      <div class="stat-item">
        <span>已出图</span>
        <strong>{{ imageDoneCount }}</strong>
      </div>
      <div class="stat-item">
        <span>可试听</span>
        <strong>{{ audioDoneCount }}</strong>
      </div>
      <div class="stat-item">
        <span>当前镜头</span>
        <strong>{{ selectedShot ? `#${selectedShot.shotIndex + 1}` : '-' }}</strong>
      </div>
    </div>

    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    <div v-if="loading" class="loading">加载中...</div>

    <main v-else-if="selectedShot" class="workspace">
      <aside class="shot-rail">
        <div class="panel-head">
          <h2>分镜列表</h2>
          <span>{{ imageProgressText }}</span>
        </div>
        <div class="shot-list">
          <button
            v-for="shot in shots"
            :key="shot.id"
            :class="['shot-row', { active: shot.id === selectedShotId }]"
            @click="selectShot(shot.id)"
          >
            <div class="shot-thumb">
              <img v-if="shot.imageUrl" :src="shot.imageUrl" alt="" />
              <span v-else>{{ shot.shotIndex + 1 }}</span>
            </div>
            <div class="shot-row-copy">
              <strong>第 {{ shot.shotIndex + 1 }} 镜</strong>
              <span>{{ compactText(shot.sceneText || shot.characterAction || '等待分镜内容', 34) }}</span>
            </div>
            <span :class="['status-dot', statusTone(shot.status)]" />
          </button>
        </div>
      </aside>

      <section class="preview-panel">
        <div class="panel-head">
          <div>
            <h2>画面预览</h2>
            <span>{{ selectedShot.cameraAngle || '镜头角度待生成' }}</span>
          </div>
          <div class="preview-actions">
            <button class="btn quiet" :disabled="busyShotId === selectedShot.id" @click="handleRegenerateImage(selectedShot.id)">
              {{ busyShotId === selectedShot.id ? '处理中...' : '重生图片' }}
            </button>
            <button class="btn primary" :disabled="savingShotId === selectedShot.id" @click="handleSaveShot(selectedShot.id)">
              {{ savingShotId === selectedShot.id ? '保存中...' : '保存镜头' }}
            </button>
          </div>
        </div>

        <div class="image-stage">
          <img v-if="selectedShot.imageUrl" :src="selectedShot.imageUrl" class="stage-image" />
          <div v-else class="stage-placeholder">
            <span class="stage-icon">▧</span>
            <strong>画面尚未生成</strong>
            <span>保存提示词后可单镜头重生，或批量生图。</span>
          </div>
        </div>

        <div class="editor-grid">
          <label class="editor-field wide">
            <span>场景描述</span>
            <textarea v-model="selectedShot.sceneText" />
          </label>
          <label class="editor-field">
            <span>镜头角度 / 运镜</span>
            <textarea v-model="selectedShot.cameraAngle" />
          </label>
          <label class="editor-field">
            <span>角色动作</span>
            <textarea v-model="selectedShot.characterAction" />
          </label>
          <label class="editor-field wide">
            <span>绘图提示词</span>
            <textarea v-model="selectedShot.imagePrompt" class="prompt-textarea" />
          </label>
        </div>
      </section>

      <aside class="side-panel">
        <section class="tool-card">
          <div class="panel-head compact">
            <h2>配音试听</h2>
            <span>{{ isPlayableAudio(selectedShot.audioUrl) ? '可试听' : selectedShot.audioUrl ? '占位音频' : '未生成' }}</span>
          </div>
          <div class="audio-box">
            <div class="avatar">{{ selectedShot.shotIndex + 1 }}</div>
            <div class="wave">
              <span v-for="bar in 18" :key="bar" :style="{ height: `${waveHeight(bar)}px` }" />
            </div>
          </div>
          <div class="tool-actions">
            <button class="btn purple" :disabled="busyShotId === selectedShot.id || !isPlayableAudio(selectedShot.audioUrl)" @click="playAudio(selectedShot.audioUrl!)">
              播放配音
            </button>
            <button class="btn quiet" :disabled="busyShotId === selectedShot.id" @click="handleRegenerateAudio(selectedShot.id)">
              {{ busyShotId === selectedShot.id ? '处理中...' : '重配音' }}
            </button>
          </div>
        </section>

        <section class="tool-card">
          <div class="panel-head compact">
            <h2>视频预览</h2>
            <span>{{ videoStatusText }}</span>
          </div>
          <video v-if="videoUrl" class="video-preview" :src="videoUrl" controls playsinline />
          <div v-else class="video-placeholder">
            <span>▶</span>
            <strong>等待合成视频</strong>
            <small>图片和配音确认后进入导出页生成成片。</small>
          </div>
          <button class="btn primary full" @click="handleOpenExport">进入导出设置</button>
        </section>

        <section class="tool-card">
          <div class="panel-head compact">
            <h2>镜头信息</h2>
          </div>
          <div class="meta-list">
            <div>
              <span>状态</span>
              <strong>{{ selectedShot.status }}</strong>
            </div>
            <div>
              <span>图片</span>
              <strong>{{ selectedShot.imageUrl ? '已生成' : '未生成' }}</strong>
            </div>
            <div>
              <span>音频</span>
              <strong>{{ isPlayableAudio(selectedShot.audioUrl) ? '已生成' : selectedShot.audioUrl ? '占位不可播' : '未生成' }}</strong>
            </div>
          </div>
        </section>
      </aside>
    </main>

    <div v-else class="empty">
      暂无分镜数据
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getShots,
  getTaskVideo,
  regenerateShotAudio,
  regenerateShotImage,
  regenerateTaskAudio,
  regenerateTaskImages,
  updateShot,
  type TaskVideoStatus,
} from '../../api/task.api';
import type { Shot } from '../../types/index';

const shots = ref<Shot[]>([]);
const loading = ref(false);
const errorMsg = ref('');
const savingShotId = ref('');
const busyShotId = ref('');
const batchGenerating = ref(false);
const batchAudioGenerating = ref(false);
const selectedShotId = ref('');
const videoUrl = ref('');
const videoStatus = ref<TaskVideoStatus['status']>('idle');
const route = useRoute();
const router = useRouter();

const taskId = String(route.query.taskId ?? '');

const selectedShot = computed(() => shots.value.find((shot) => shot.id === selectedShotId.value) ?? shots.value[0] ?? null);
const imageDoneCount = computed(() => shots.value.filter((shot) => Boolean(shot.imageUrl)).length);
const audioDoneCount = computed(() => shots.value.filter((shot) => isPlayableAudio(shot.audioUrl)).length);
const imageProgressText = computed(() => `${imageDoneCount.value}/${shots.value.length} 已出图`);
const videoStatusText = computed(() => {
  const map: Record<TaskVideoStatus['status'], string> = {
    idle: '未生成',
    processing: '合成中',
    ready: '可预览',
    failed: '失败',
  };
  return map[videoStatus.value] ?? '未生成';
});

watch(selectedShot, (shot) => {
  if (shot && selectedShotId.value !== shot.id) selectedShotId.value = shot.id;
});

onMounted(async () => {
  if (!taskId) return;
  await reloadShots();
  await refreshVideoStatus();
});

async function reloadShots() {
  if (!taskId) return;
  loading.value = true;
  errorMsg.value = '';
  try {
    shots.value = await getShots(taskId);
    if (!selectedShotId.value || !shots.value.some((shot) => shot.id === selectedShotId.value)) {
      selectedShotId.value = shots.value[0]?.id ?? '';
    }
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '分镜加载失败';
  } finally {
    loading.value = false;
  }
}

async function refreshVideoStatus() {
  if (!taskId) return;
  try {
    const status = await getTaskVideo(taskId);
    videoStatus.value = status.status;
    videoUrl.value = status.videoUrl ?? '';
  } catch {
    videoStatus.value = 'idle';
    videoUrl.value = '';
  }
}

function selectShot(shotId: string) {
  selectedShotId.value = shotId;
}

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
    selectedShotId.value = result.id;
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
      shot.status = isPlayableAudio(audioUrl) ? 'tts_done' : 'tts_failed';
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
    await reloadShots();
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
    await reloadShots();
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
  if (!isPlayableAudio(url)) {
    uni.showToast({ title: '配音未生成', icon: 'none' });
    return;
  }
  const audio = uni.createInnerAudioContext();
  audio.src = url;
  audio.play();
}

function isPlayableAudio(url?: string | null) {
  if (!url) return false;
  if (url.includes('example.com/') || url.includes('placeholder')) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:audio/');
}

function handleOpenExport() {
  if (!taskId) return;
  router.push({ path: '/pages/export/index', query: { taskId } });
}

function compactText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function statusTone(status: string) {
  if (status.includes('failed')) return 'danger';
  if (status.includes('done')) return 'success';
  return 'pending';
}

function waveHeight(index: number) {
  return 12 + ((index * 7) % 28);
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f6f9fd; color: #17233d; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 24px 28px; background: linear-gradient(180deg, #ffffff 0%, #eef7ff 100%); border-bottom: 1px solid #d8e8f8; }
.eyebrow { color: #3974d8; font-size: 13px; font-weight: 800; }
.title { margin: 4px 0 0; font-size: 30px; line-height: 1.2; }
.subtitle { margin: 8px 0 0; color: #64748b; font-size: 14px; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.btn { border: 1px solid transparent; border-radius: 8px; padding: 11px 14px; font-size: 14px; font-weight: 800; background: #fff; color: #27415f; }
.btn.primary { background: #276fe6; color: #fff; }
.btn.accent { background: #168672; color: #fff; }
.btn.purple { background: #7057d8; color: #fff; }
.btn.quiet { border-color: #bad3fb; color: #276fe6; }
.btn.full { width: 100%; margin-top: 14px; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.stats-bar { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding: 18px 28px 0; }
.stat-item { background: #fff; border: 1px solid #d9e8f6; border-radius: 8px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; }
.stat-item span { color: #64748b; font-size: 13px; }
.stat-item strong { font-size: 20px; }
.error-msg { margin: 16px 28px 0; color: #c62828; background: #ffebee; border-radius: 8px; padding: 12px 16px; }
.loading, .empty { min-height: 420px; display: flex; align-items: center; justify-content: center; color: #64748b; }
.workspace { display: grid; grid-template-columns: 320px minmax(0, 1fr) 340px; gap: 16px; padding: 18px 28px 28px; }
.shot-rail, .preview-panel, .tool-card { background: #fff; border: 1px solid #d9e8f6; border-radius: 8px; box-shadow: 0 10px 26px rgba(34, 92, 150, 0.06); }
.shot-rail { min-height: 720px; overflow: hidden; display: flex; flex-direction: column; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-bottom: 1px solid #e4edf8; }
.panel-head.compact { padding: 0 0 14px; border-bottom: 0; }
.panel-head h2 { margin: 0; font-size: 18px; }
.panel-head span { color: #64748b; font-size: 13px; }
.shot-list { padding: 10px; overflow: auto; display: grid; gap: 8px; }
.shot-row { width: 100%; display: grid; grid-template-columns: 58px minmax(0, 1fr) 10px; align-items: center; gap: 10px; border: 1px solid transparent; border-radius: 8px; padding: 10px; background: #fbfdff; text-align: left; }
.shot-row.active { border-color: #276fe6; background: #eef5ff; }
.shot-thumb { width: 58px; height: 58px; border-radius: 8px; overflow: hidden; background: #e8eef7; display: flex; align-items: center; justify-content: center; color: #527096; font-weight: 900; }
.shot-thumb img { width: 100%; height: 100%; object-fit: cover; }
.shot-row-copy { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.shot-row-copy strong { font-size: 14px; color: #17233d; }
.shot-row-copy span { color: #64748b; font-size: 12px; line-height: 1.4; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; background: #b8c4d6; }
.status-dot.success { background: #1aa99a; }
.status-dot.danger { background: #d32f2f; }
.preview-panel { min-height: 720px; overflow: hidden; }
.preview-actions, .tool-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.image-stage { margin: 16px 18px; min-height: 390px; border-radius: 8px; overflow: hidden; background: #101827; display: flex; align-items: center; justify-content: center; }
.stage-image { width: 100%; height: 100%; min-height: 390px; object-fit: contain; background: #101827; }
.stage-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: rgba(255,255,255,0.72); text-align: center; padding: 32px; }
.stage-icon { font-size: 48px; line-height: 1; }
.editor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; padding: 0 18px 18px; }
.editor-field { display: flex; flex-direction: column; gap: 8px; }
.editor-field.wide { grid-column: span 2; }
.editor-field span { color: #53657e; font-size: 13px; font-weight: 800; }
.editor-field textarea { width: 100%; min-height: 92px; resize: vertical; border: 1px solid #cddcf0; border-radius: 8px; padding: 12px 13px; line-height: 1.55; outline: none; color: #17233d; background: #fbfdff; }
.editor-field textarea:focus { border-color: #276fe6; background: #fff; box-shadow: 0 0 0 3px rgba(39, 111, 230, 0.12); }
.prompt-textarea { min-height: 132px; color: #315fd2; }
.side-panel { display: grid; gap: 16px; align-content: start; }
.tool-card { padding: 18px; }
.audio-box { border: 1px solid #e2eaf6; border-radius: 8px; padding: 14px; display: flex; align-items: center; gap: 12px; background: #fbfdff; }
.avatar { width: 44px; height: 44px; border-radius: 50%; background: #eef5ff; color: #276fe6; display: flex; align-items: center; justify-content: center; font-weight: 900; }
.wave { flex: 1; min-height: 48px; display: flex; align-items: center; gap: 4px; }
.wave span { width: 5px; border-radius: 999px; background: linear-gradient(180deg, #8f7df1, #276fe6); opacity: 0.78; }
.tool-actions { margin-top: 14px; }
.video-preview, .video-placeholder { width: 100%; min-height: 190px; border-radius: 8px; background: #101827; }
.video-preview { display: block; }
.video-placeholder { color: rgba(255,255,255,0.72); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 8px; padding: 22px; }
.video-placeholder span { font-size: 42px; line-height: 1; }
.video-placeholder small { color: rgba(255,255,255,0.58); line-height: 1.5; }
.meta-list { display: grid; gap: 10px; }
.meta-list div { display: flex; justify-content: space-between; gap: 10px; border-bottom: 1px solid #edf2f8; padding-bottom: 10px; }
.meta-list div:last-child { border-bottom: 0; padding-bottom: 0; }
.meta-list span { color: #64748b; }
.meta-list strong { color: #17233d; }
@media (max-width: 1180px) {
  .workspace { grid-template-columns: 280px minmax(0, 1fr); }
  .side-panel { grid-column: 1 / -1; grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 820px) {
  .header { flex-direction: column; }
  .header-actions { justify-content: flex-start; }
  .stats-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); padding-left: 18px; padding-right: 18px; }
  .workspace { grid-template-columns: 1fr; padding-left: 18px; padding-right: 18px; }
  .side-panel { grid-template-columns: 1fr; }
  .shot-rail, .preview-panel { min-height: 0; }
  .editor-grid { grid-template-columns: 1fr; }
  .editor-field.wide { grid-column: auto; }
}
</style>

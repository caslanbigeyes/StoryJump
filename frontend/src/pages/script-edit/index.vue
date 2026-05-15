<template>
  <div class="page">
    <div class="header">
      <span class="title">编辑剧本</span>
      <div class="header-actions">
        <button class="btn-outline" :disabled="resplitting || !taskId" @click="handleOpenStoryboard">
          查看分镜
        </button>
        <button class="btn-save" :disabled="saving || !taskId" @click="handleSave">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="editor-wrap">
      <label class="field">
        <span class="label">标题</span>
        <input v-model="script.title" class="input" />
      </label>

      <label class="field">
        <span class="label">一句话梗概</span>
        <textarea v-model="script.logline" class="textarea short" />
      </label>

      <label class="field">
        <span class="label">主题</span>
        <textarea v-model="script.theme" class="textarea short" />
      </label>

      <label class="field">
        <span class="label">开端</span>
        <textarea v-model="script.structure.beginning" class="textarea" />
      </label>

      <label class="field">
        <span class="label">发展</span>
        <textarea v-model="script.structure.development" class="textarea" />
      </label>

      <label class="field">
        <span class="label">转折</span>
        <textarea v-model="script.structure.turning_point" class="textarea" />
      </label>

      <label class="field">
        <span class="label">结尾</span>
        <textarea v-model="script.structure.ending" class="textarea" />
      </label>

      <label class="field">
        <span class="label">旁白</span>
        <textarea v-model="script.narration" class="textarea long" />
      </label>
    </div>

    <div class="toolbar">
      <textarea
        v-model="rewriteInstructions"
        class="rewrite-input"
        placeholder="输入改写要求，例如：更紧凑、更电影化、更像悬疑短片"
      />
      <div class="toolbar-actions">
        <button class="btn-resplit" :disabled="resplitting || !taskId" @click="handleResplit">
          {{ resplitting ? '重新拆分中...' : '保存并重新拆分分镜' }}
        </button>
        <button class="btn-rewrite" :disabled="rewriting || !taskId" @click="handleRewrite">
          {{ rewriting ? '改写中...' : 'AI 智能改写' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getTaskResult, resplitTaskStoryboard, rewriteTaskScript, updateTaskScript } from '../../api/task.api';
import type { StoryScript } from '../../types/index';

const route = useRoute();
const router = useRouter();
const taskId = String(route.query.taskId ?? '');
const loading = ref(false);
const saving = ref(false);
const rewriting = ref(false);
const resplitting = ref(false);
const errorMsg = ref('');
const rewriteInstructions = ref('');
const script = ref<StoryScript>({
  title: '',
  logline: '',
  theme: '',
  structure: {
    beginning: '',
    development: '',
    turning_point: '',
    ending: '',
  },
  narration: '',
});

onMounted(async () => {
  if (!taskId) {
    errorMsg.value = '缺少任务 ID';
    return;
  }

  loading.value = true;
  try {
    const result = await getTaskResult(taskId);
    if (!result?.script) {
      errorMsg.value = '剧本结果尚未生成';
      return;
    }
    script.value = structuredClone(result.script);
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '剧本加载失败';
  } finally {
    loading.value = false;
  }
});

async function handleSave() {
  if (!taskId || saving.value) return;
  saving.value = true;
  errorMsg.value = '';
  try {
    const result = await updateTaskScript(taskId, script.value);
    script.value = structuredClone(result.script);
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '保存失败';
  } finally {
    saving.value = false;
  }
}

async function saveCurrentScript() {
  const result = await updateTaskScript(taskId, script.value);
  script.value = structuredClone(result.script);
}

async function handleRewrite() {
  if (!taskId || rewriting.value) return;
  rewriting.value = true;
  errorMsg.value = '';
  try {
    const result = await rewriteTaskScript(taskId, rewriteInstructions.value.trim() || undefined);
    script.value = structuredClone(result.script);
    uni.showToast({ title: '改写完成', icon: 'success' });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '改写失败';
  } finally {
    rewriting.value = false;
  }
}

async function handleResplit() {
  if (!taskId || resplitting.value) return;
  resplitting.value = true;
  errorMsg.value = '';
  try {
    await saveCurrentScript();
    await resplitTaskStoryboard(taskId);
    uni.showToast({ title: '分镜已重新拆分', icon: 'success' });
    router.push({ path: '/pages/storyboard/index', query: { taskId } });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '重新拆分失败';
  } finally {
    resplitting.value = false;
  }
}

function handleOpenStoryboard() {
  if (!taskId) return;
  router.push({ path: '/pages/storyboard/index', query: { taskId } });
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f7fa; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; background: #fff; }
.header-actions { display: flex; gap: 12px; }
.title { font-size: 28px; font-weight: bold; }
.btn-outline { background: #fff; color: #3857d7; border-radius: 12px; padding: 12px 20px; font-size: 16px; border: 1px solid #bfd2ff; }
.btn-save { background: #6c63ff; color: #fff; border-radius: 12px; padding: 12px 20px; font-size: 16px; border: none; }
.btn-save:disabled, .btn-rewrite:disabled, .btn-resplit:disabled, .btn-outline:disabled { opacity: 0.6; cursor: not-allowed; }
.loading, .error-msg { margin: 24px; }
.error-msg { color: #c62828; }
.editor-wrap { flex: 1; margin: 24px; background: #fff; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.label { font-size: 14px; color: #666; }
.input, .textarea, .rewrite-input { width: 100%; border: 1px solid #d9dff0; border-radius: 12px; padding: 14px 16px; font-size: 15px; }
.textarea { min-height: 120px; resize: vertical; }
.textarea.short { min-height: 84px; }
.textarea.long { min-height: 200px; }
.toolbar { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 12px; }
.toolbar-actions { display: flex; gap: 12px; }
.rewrite-input { min-height: 80px; resize: vertical; background: #fff; }
.btn-rewrite, .btn-resplit { flex: 1; color: #fff; border-radius: 16px; padding: 18px 24px; font-size: 18px; border: none; }
.btn-rewrite { background: #ff7043; }
.btn-resplit { background: #1f7a5f; }
</style>

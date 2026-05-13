<template>
  <div class="page">
    <div class="header">
      <span class="title">创建任务</span>
    </div>

    <div class="form">
      <div class="field">
        <label class="label">任务标题</label>
        <input v-model="form.title" class="input" placeholder="输入任务标题" />
      </div>

      <div class="field">
        <label class="label">视频主题</label>
        <textarea v-model="form.topic" class="textarea" placeholder="描述您想要创作的视频主题，越详细效果越好..." />
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <button class="btn-primary" :disabled="loading" @click="handleCreate">
        {{ loading ? '创建中...' : '开始创作' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { createTask } from '../../api/task.api';

const form = reactive({
  title: '',
  topic: '',
});
const loading = ref(false);
const errorMsg = ref('');

async function handleCreate() {
  if (loading.value) return;
  if (!form.title.trim() || !form.topic.trim()) {
    errorMsg.value = '请填写任务标题和视频主题';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    const result = await createTask({ title: form.title.trim(), topic: form.topic.trim() });
    uni.redirectTo({ url: `/pages/task-detail/index?taskId=${result.taskId}` });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '创建失败，请重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f7fa; }
.header { padding: 32px; background: #fff; }
.title { font-size: 40px; font-weight: bold; }
.form { padding: 32px; }
.field { background: #fff; border-radius: 20px; padding: 32px; margin-bottom: 24px; }
.label { font-size: 18px; color: #666; display: block; margin-bottom: 16px; }
.input { width: 100%; font-size: 18px; border: 0; outline: none; }
.textarea { width: 100%; font-size: 18px; min-height: 200px; border: 0; outline: none; resize: vertical; }
.error-msg { color: #f44336; font-size: 16px; display: block; margin: 0 0 16px; text-align: center; }
.btn-primary { width: 100%; background: #6c63ff; color: #fff; border-radius: 16px; padding: 20px 32px; font-size: 20px; border: none; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
</style>

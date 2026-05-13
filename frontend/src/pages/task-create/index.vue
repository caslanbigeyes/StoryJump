<template>
  <view class="page">
    <view class="header">
      <text class="title">创建任务</text>
    </view>

    <view class="form">
      <view class="field">
        <text class="label">任务标题</text>
        <input v-model="form.title" class="input" placeholder="输入任务标题" />
      </view>

      <view class="field">
        <text class="label">视频主题</text>
        <textarea v-model="form.topic" class="textarea" placeholder="描述您想要创作的视频主题，越详细效果越好..." />
      </view>

      <text v-if="errorMsg" class="error-msg">{{ errorMsg }}</text>

      <button class="btn-primary" :loading="loading" @tap="handleCreate">
        开始创作
      </button>
    </view>
  </view>
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
  if (!form.title.trim() || !form.topic.trim()) {
    errorMsg.value = '请填写任务标题和视频主题';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    const result = await createTask({ title: form.title, topic: form.topic });
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
.header { padding: 32rpx; background: #fff; }
.title { font-size: 40rpx; font-weight: bold; }
.form { padding: 32rpx; }
.field { background: #fff; border-radius: 20rpx; padding: 32rpx; margin-bottom: 24rpx; }
.label { font-size: 28rpx; color: #666; display: block; margin-bottom: 16rpx; }
.input { width: 100%; font-size: 30rpx; }
.textarea { width: 100%; font-size: 30rpx; min-height: 200rpx; }
.error-msg { color: #f44336; font-size: 26rpx; display: block; margin-bottom: 16rpx; text-align: center; }
.btn-primary { width: 100%; background: #6c63ff; color: #fff; border-radius: 16rpx; padding: 32rpx; font-size: 32rpx; border: none; }
</style>

<template>
  <view class="page">
    <view class="header">
      <text class="title">编辑文案</text>
      <button class="btn-save" :loading="saving" @tap="handleSave">保存</button>
    </view>

    <view class="editor-wrap">
      <textarea
        v-model="scriptContent"
        class="editor"
        placeholder="在此编辑您的剧本内容..."
        :auto-height="true"
      />
    </view>

    <view class="toolbar">
      <button class="btn-rewrite" :loading="rewriting" @tap="handleRewrite">
        AI 智能改写
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// TODO: 从路由参数获取 taskId，加载剧本内容
const scriptContent = ref('');
const saving = ref(false);
const rewriting = ref(false);

onMounted(() => {
  // TODO: 加载已有剧本内容
  scriptContent.value = '';
});

async function handleSave() {
  saving.value = true;
  try {
    // TODO: 调用 API 保存剧本
    await new Promise((r) => setTimeout(r, 500));
    uni.showToast({ title: '保存成功', icon: 'success' });
  } finally {
    saving.value = false;
  }
}

async function handleRewrite() {
  rewriting.value = true;
  try {
    // TODO: 调用 AI 改写接口
    await new Promise((r) => setTimeout(r, 1000));
    uni.showToast({ title: '改写完成', icon: 'success' });
  } finally {
    rewriting.value = false;
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f7fa; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 32rpx; background: #fff; }
.title { font-size: 36rpx; font-weight: bold; }
.btn-save { background: #6c63ff; color: #fff; border-radius: 16rpx; padding: 12rpx 28rpx; font-size: 28rpx; border: none; }
.editor-wrap { flex: 1; margin: 24rpx; background: #fff; border-radius: 20rpx; padding: 32rpx; }
.editor { width: 100%; min-height: 60vh; font-size: 30rpx; line-height: 1.8; }
.toolbar { padding: 24rpx; }
.btn-rewrite { width: 100%; background: #ff7043; color: #fff; border-radius: 16rpx; padding: 32rpx; font-size: 32rpx; border: none; }
</style>

<template>
  <view class="page">
    <view class="header">
      <text class="title">导出视频</text>
    </view>

    <view class="preview-section">
      <!-- TODO: 视频预览播放器 -->
      <view class="video-placeholder">
        <text class="placeholder-icon">▶</text>
        <text class="placeholder-text">视频预览</text>
      </view>
    </view>

    <view class="export-options">
      <view class="option-item">
        <text class="option-label">分辨率</text>
        <picker :value="resolutionIndex" :range="resolutions" @change="onResolutionChange">
          <view class="picker-value">{{ resolutions[resolutionIndex] }}</view>
        </picker>
      </view>
      <view class="option-item">
        <text class="option-label">格式</text>
        <picker :value="formatIndex" :range="formats" @change="onFormatChange">
          <view class="picker-value">{{ formats[formatIndex] }}</view>
        </picker>
      </view>
    </view>

    <view class="actions">
      <button class="btn-export" :loading="exporting" @tap="handleExport">
        {{ exporting ? '导出中...' : '开始导出' }}
      </button>
    </view>

    <view v-if="exportUrl" class="result">
      <text class="result-label">导出成功！</text>
      <text class="result-url" @tap="copyUrl">{{ exportUrl }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const resolutions = ['1080x1920', '720x1280', '540x960'];
const formats = ['MP4', 'MOV'];
const resolutionIndex = ref(0);
const formatIndex = ref(0);
const exporting = ref(false);
const exportUrl = ref('');

function onResolutionChange(e: any) {
  resolutionIndex.value = e.detail.value;
}

function onFormatChange(e: any) {
  formatIndex.value = e.detail.value;
}

async function handleExport() {
  exporting.value = true;
  try {
    // TODO: 调用后端导出接口，合成视频
    await new Promise((r) => setTimeout(r, 2000));
    exportUrl.value = 'https://example.com/exported-video.mp4';
    uni.showToast({ title: '导出成功', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: '导出失败', icon: 'error' });
  } finally {
    exporting.value = false;
  }
}

function copyUrl() {
  uni.setClipboardData({ data: exportUrl.value });
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f7fa; }
.header { padding: 32rpx; background: #fff; }
.title { font-size: 36rpx; font-weight: bold; }
.preview-section { margin: 24rpx; }
.video-placeholder { background: #1a1a2e; border-radius: 20rpx; height: 480rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.placeholder-icon { font-size: 80rpx; color: rgba(255,255,255,0.5); }
.placeholder-text { font-size: 28rpx; color: rgba(255,255,255,0.5); margin-top: 16rpx; }
.export-options { margin: 0 24rpx; background: #fff; border-radius: 20rpx; padding: 8rpx 0; }
.option-item { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 32rpx; border-bottom: 1rpx solid #f0f0f0; }
.option-item:last-child { border-bottom: none; }
.option-label { font-size: 30rpx; color: #333; }
.picker-value { font-size: 30rpx; color: #6c63ff; }
.actions { padding: 32rpx; }
.btn-export { width: 100%; background: #6c63ff; color: #fff; border-radius: 16rpx; padding: 32rpx; font-size: 32rpx; border: none; }
.result { margin: 0 24rpx; background: #e8f5e9; border-radius: 20rpx; padding: 24rpx 32rpx; }
.result-label { font-size: 28rpx; color: #4caf50; display: block; margin-bottom: 8rpx; }
.result-url { font-size: 24rpx; color: #666; word-break: break-all; }
</style>

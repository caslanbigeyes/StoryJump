<template>
  <view class="page">
    <view class="header">
      <text class="title">分镜列表</text>
      <text class="count">共 {{ shots.length }} 个分镜</text>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <scroll-view v-else scroll-y class="shot-list">
      <view
        v-for="shot in shots"
        :key="shot.id"
        class="shot-card"
      >
        <!-- 分镜序号 -->
        <view class="shot-index-bar">
          <text class="shot-index">第 {{ shot.shotIndex + 1 }} 镜</text>
          <view :class="['shot-status', `shot-status-${shot.status}`]">
            <text class="shot-status-text">{{ shot.status }}</text>
          </view>
        </view>

        <!-- 图片预览 -->
        <view class="shot-image-wrap">
          <image
            v-if="shot.imageUrl"
            :src="shot.imageUrl"
            class="shot-image"
            mode="aspectFill"
          />
          <view v-else class="shot-image-placeholder">
            <text class="placeholder-text">图片生成中...</text>
          </view>
        </view>

        <!-- 场景文本 -->
        <view class="shot-info">
          <view class="info-row">
            <text class="info-label">场景描述</text>
            <text class="info-value">{{ shot.sceneText ?? '——' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">镜头角度</text>
            <text class="info-value">{{ shot.cameraAngle ?? '——' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">绘图提示词</text>
            <text class="info-value prompt">{{ shot.imagePrompt ?? '生成中...' }}</text>
          </view>
        </view>

        <!-- 音频播放 -->
        <view v-if="shot.audioUrl" class="shot-audio">
          <button class="btn-play" @tap="playAudio(shot.audioUrl!)">播放配音</button>
        </view>
      </view>

      <view v-if="shots.length === 0" class="empty">
        <text>暂无分镜数据</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getShots } from '../../api/task.api';
import type { Shot } from '../../types/index';

const shots = ref<Shot[]>([]);
const loading = ref(false);

// 从路由参数获取 taskId
const pages = getCurrentPages();
const currentPage = pages[pages.length - 1] as any;
const taskId: string = currentPage?.options?.taskId ?? '';

onMounted(async () => {
  if (!taskId) return;
  loading.value = true;
  try {
    shots.value = await getShots(taskId);
  } finally {
    loading.value = false;
  }
});

function playAudio(url: string) {
  // TODO: 使用 uni.createInnerAudioContext 播放音频
  const audio = uni.createInnerAudioContext();
  audio.src = url;
  audio.play();
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f7fa; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 32rpx; background: #fff; }
.title { font-size: 36rpx; font-weight: bold; }
.count { font-size: 26rpx; color: #999; }
.loading { flex: 1; display: flex; align-items: center; justify-content: center; }
.shot-list { flex: 1; padding: 16rpx; }
.shot-card { background: #fff; border-radius: 20rpx; margin-bottom: 24rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.shot-index-bar { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 32rpx; background: #fafafa; border-bottom: 1rpx solid #f0f0f0; }
.shot-index { font-size: 28rpx; font-weight: bold; color: #333; }
.shot-status { border-radius: 10rpx; padding: 4rpx 14rpx; background: #eee; }
.shot-status-text { font-size: 22rpx; color: #666; }
.shot-status-tts_done .shot-status { background: #e8f5e9; }
.shot-status-tts_done .shot-status-text { color: #4caf50; }
.shot-image-wrap { width: 100%; height: 360rpx; background: #f0f0f0; }
.shot-image { width: 100%; height: 100%; }
.shot-image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.placeholder-text { font-size: 28rpx; color: #bbb; }
.shot-info { padding: 24rpx 32rpx; }
.info-row { display: flex; margin-bottom: 16rpx; }
.info-label { font-size: 26rpx; color: #999; width: 160rpx; flex-shrink: 0; }
.info-value { font-size: 26rpx; color: #333; flex: 1; line-height: 1.6; }
.info-value.prompt { color: #6c63ff; font-size: 24rpx; }
.shot-audio { padding: 0 32rpx 24rpx; }
.btn-play { background: #e3f2fd; color: #2196f3; border-radius: 12rpx; padding: 16rpx; font-size: 26rpx; border: none; }
.empty { text-align: center; padding: 80rpx; color: #bbb; font-size: 28rpx; }
</style>

<template>
  <view class="page">
    <view class="header">
      <text class="title">我的任务</text>
      <button class="btn-create" @tap="goCreate">+ 新建</button>
    </view>

    <view v-if="taskStore.loading" class="loading">
      <text>加载中...</text>
    </view>

    <scroll-view v-else scroll-y class="task-list">
      <view
        v-for="task in taskStore.tasks"
        :key="task.id"
        class="task-card"
        @tap="goDetail(task.id)"
      >
        <view class="task-header">
          <text class="task-title">{{ task.title }}</text>
          <view :class="['status-badge', `status-${task.status}`]">
            <text>{{ statusLabel(task.status) }}</text>
          </view>
        </view>
        <view class="task-progress">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: task.progress + '%' }" />
          </view>
          <text class="progress-text">{{ task.progress }}%</text>
        </view>
        <text class="task-date">{{ formatDate(task.createdAt) }}</text>
      </view>

      <view v-if="taskStore.tasks.length === 0" class="empty">
        <text>暂无任务，点击右上角创建</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTaskStore } from '../../stores/task.store';
import { TaskStatus } from '../../types/index';

const taskStore = useTaskStore();

onMounted(() => {
  taskStore.fetchTasks();
});

function statusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    [TaskStatus.PENDING]: '等待中',
    [TaskStatus.RUNNING]: '生成中',
    [TaskStatus.SUCCESS]: '已完成',
    [TaskStatus.FAILED]: '失败',
  };
  return map[status] ?? status;
}

function formatDate(dateStr: string): string {
  // TODO: 格式化日期
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function goCreate() {
  uni.navigateTo({ url: '/pages/task-create/index' });
}

function goDetail(taskId: string) {
  uni.navigateTo({ url: `/pages/task-detail/index?taskId=${taskId}` });
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; background: #f5f7fa; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 32rpx; background: #fff; }
.title { font-size: 40rpx; font-weight: bold; }
.btn-create { background: #6c63ff; color: #fff; border-radius: 20rpx; padding: 12rpx 28rpx; font-size: 28rpx; border: none; }
.loading { flex: 1; display: flex; align-items: center; justify-content: center; }
.task-list { flex: 1; padding: 16rpx; }
.task-card { background: #fff; border-radius: 20rpx; padding: 32rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.task-title { font-size: 32rpx; font-weight: bold; flex: 1; margin-right: 16rpx; }
.status-badge { border-radius: 12rpx; padding: 6rpx 16rpx; }
.status-badge text { font-size: 24rpx; }
.status-pending { background: #fff3e0; }
.status-pending text { color: #ff9800; }
.status-running { background: #e3f2fd; }
.status-running text { color: #2196f3; }
.status-success { background: #e8f5e9; }
.status-success text { color: #4caf50; }
.status-failed { background: #ffebee; }
.status-failed text { color: #f44336; }
.task-progress { display: flex; align-items: center; margin-bottom: 12rpx; }
.progress-bar { flex: 1; height: 8rpx; background: #eee; border-radius: 4rpx; margin-right: 16rpx; overflow: hidden; }
.progress-fill { height: 100%; background: #6c63ff; border-radius: 4rpx; transition: width 0.3s; }
.progress-text { font-size: 24rpx; color: #999; width: 70rpx; text-align: right; }
.task-date { font-size: 24rpx; color: #bbb; }
.empty { text-align: center; padding: 80rpx; color: #bbb; font-size: 28rpx; }
</style>

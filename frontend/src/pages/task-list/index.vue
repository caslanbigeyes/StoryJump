<template>
  <div class="page">
    <div class="header">
      <span class="title">我的任务</span>
      <button class="btn-create" @click="goCreate">+ 新建</button>
    </div>

    <div v-if="taskStore.loading" class="loading">加载中...</div>

    <div v-else class="task-list">
      <div
        v-for="task in taskStore.tasks"
        :key="task.id"
        class="task-card"
        @click="goDetail(task.id)"
      >
        <div class="task-header">
          <span class="task-title">{{ task.title }}</span>
          <div :class="['status-badge', `status-${task.status}`]">
            <span>{{ statusLabel(task.status) }}</span>
          </div>
        </div>
        <div class="task-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: task.progress + '%' }" />
          </div>
          <span class="progress-text">{{ task.progress }}%</span>
        </div>
        <span class="task-date">{{ formatDate(task.createdAt) }}</span>
      </div>

      <div v-if="taskStore.tasks.length === 0" class="empty">
        暂无任务，点击右上角创建
      </div>
    </div>
  </div>
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
.header { display: flex; justify-content: space-between; align-items: center; padding: 32px; background: #fff; }
.title { font-size: 32px; font-weight: bold; }
.btn-create { background: #6c63ff; color: #fff; border-radius: 20px; padding: 12px 20px; font-size: 18px; border: none; }
.loading { flex: 1; display: flex; align-items: center; justify-content: center; }
.task-list { flex: 1; padding: 16px; overflow: auto; }
.task-card { background: #fff; border-radius: 20px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); cursor: pointer; }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 16px; }
.task-title { font-size: 22px; font-weight: bold; flex: 1; }
.status-badge { border-radius: 12px; padding: 6px 16px; }
.status-badge span { font-size: 14px; }
.status-pending { background: #fff3e0; }
.status-pending span { color: #ff9800; }
.status-running { background: #e3f2fd; }
.status-running span { color: #2196f3; }
.status-success { background: #e8f5e9; }
.status-success span { color: #4caf50; }
.status-failed { background: #ffebee; }
.status-failed span { color: #f44336; }
.task-progress { display: flex; align-items: center; margin-bottom: 12px; }
.progress-bar { flex: 1; height: 8px; background: #eee; border-radius: 4px; margin-right: 16px; overflow: hidden; }
.progress-fill { height: 100%; background: #6c63ff; border-radius: 4px; transition: width 0.3s; }
.progress-text { font-size: 14px; color: #999; width: 56px; text-align: right; }
.task-date { font-size: 14px; color: #bbb; }
.empty { text-align: center; padding: 80px; color: #bbb; font-size: 18px; }
</style>

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getTaskList, getTask, getShots } from '../api/task.api';
import type { Task, Shot, PaginatedResult } from '../types/index';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([]);
  const currentTask = ref<Task | null>(null);
  const currentShots = ref<Shot[]>([]);
  const total = ref<number>(0);
  const loading = ref<boolean>(false);

  async function fetchTasks(page = 1, limit = 20) {
    loading.value = true;
    try {
      const result: PaginatedResult<Task> = await getTaskList(page, limit);
      tasks.value = result.data;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTask(taskId: string) {
    loading.value = true;
    try {
      const task = await getTask(taskId);
      currentTask.value = task;
      currentShots.value = task.shots ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchShots(taskId: string) {
    const shots = await getShots(taskId);
    currentShots.value = shots;
  }

  function clearCurrentTask() {
    currentTask.value = null;
    currentShots.value = [];
  }

  return {
    tasks,
    currentTask,
    currentShots,
    total,
    loading,
    fetchTasks,
    fetchTask,
    fetchShots,
    clearCurrentTask,
  };
});

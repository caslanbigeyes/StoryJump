import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import LoginPage from '../pages/login/index.vue';
import TaskListPage from '../pages/task-list/index.vue';
import TaskCreatePage from '../pages/task-create/index.vue';
import TaskDetailPage from '../pages/task-detail/index.vue';
import StoryboardPage from '../pages/storyboard/index.vue';
import ScriptEditPage from '../pages/script-edit/index.vue';
import ExportPage from '../pages/export/index.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/pages/task-list/index' },
  { path: '/pages/login/index', component: LoginPage, meta: { public: true } },
  { path: '/pages/task-list/index', component: TaskListPage },
  { path: '/pages/task-create/index', component: TaskCreatePage },
  { path: '/pages/task-detail/index', component: TaskDetailPage },
  { path: '/pages/storyboard/index', component: StoryboardPage },
  { path: '/pages/script-edit/index', component: ScriptEditPage },
  { path: '/pages/export/index', component: ExportPage },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = globalThis.uni?.getStorageSync('token') ?? '';
  if (!to.meta.public && !token) {
    return '/pages/login/index';
  }
  if (to.path === '/pages/login/index' && token) {
    return '/pages/task-list/index';
  }
  return true;
});

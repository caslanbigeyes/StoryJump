<template>
  <div class="login-page">
    <div class="logo">
      <span class="logo-text">StoryJump</span>
      <span class="logo-sub">AI 短视频创作平台</span>
    </div>

    <div class="form">
      <div class="tab-bar">
        <button type="button" :class="['tab', mode === 'login' ? 'active' : '']" @click="mode = 'login'">登录</button>
        <button type="button" :class="['tab', mode === 'register' ? 'active' : '']" @click="mode = 'register'">注册</button>
      </div>

      <input
        v-model="email"
        class="input"
        type="text"
        placeholder="邮箱"
        placeholder-class="placeholder"
      />
      <input
        v-model="password"
        class="input"
        type="password"
        placeholder="密码"
        placeholder-class="placeholder"
      />

      <button class="btn-primary" :disabled="loading" @click="handleSubmit">
        {{ mode === 'login' ? '登录' : '注册' }}
      </button>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();

const mode = ref<'login' | 'register'>('login');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function handleSubmit() {
  if (loading.value) return;
  if (!email.value || !password.value) {
    errorMsg.value = '请填写邮箱和密码';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    if (mode.value === 'login') {
      await authStore.doLogin({ email: email.value, password: password.value });
    } else {
      await authStore.doRegister({ email: email.value, password: password.value });
    }
    uni.switchTab({ url: '/pages/task-list/index' });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '操作失败，请重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px;
  background: #f5f7fa;
}
.logo { text-align: center; margin-bottom: 48px; }
.logo-text { font-size: 48px; font-weight: bold; color: #333; display: block; }
.logo-sub { font-size: 18px; color: #999; margin-top: 8px; display: block; }
.form { width: 100%; max-width: 480px; background: #fff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.tab-bar { display: flex; margin-bottom: 32px; border-bottom: 2px solid #eee; gap: 8px; }
.tab { flex: 1; text-align: center; padding: 0 0 16px; font-size: 20px; color: #999; border: none; background: transparent; }
.tab.active { color: #333; font-weight: bold; border-bottom: 4px solid #6c63ff; }
.input { width: 100%; border: 2px solid #eee; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; font-size: 18px; }
.btn-primary { width: 100%; background: #6c63ff; color: #fff; border-radius: 12px; padding: 16px 20px; font-size: 20px; border: none; margin-top: 8px; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.error-msg { color: #f44336; font-size: 16px; margin: 16px 0 0; text-align: center; display: block; }
.placeholder { color: #bbb; }
</style>

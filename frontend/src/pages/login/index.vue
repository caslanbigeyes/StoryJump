<template>
  <view class="login-page">
    <view class="logo">
      <text class="logo-text">StoryJump</text>
      <text class="logo-sub">AI 短视频创作平台</text>
    </view>

    <view class="form">
      <view class="tab-bar">
        <text :class="['tab', mode === 'login' ? 'active' : '']" @tap="mode = 'login'">登录</text>
        <text :class="['tab', mode === 'register' ? 'active' : '']" @tap="mode = 'register'">注册</text>
      </view>

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

      <button class="btn-primary" :loading="loading" @tap="handleSubmit">
        {{ mode === 'login' ? '登录' : '注册' }}
      </button>

      <text v-if="errorMsg" class="error-msg">{{ errorMsg }}</text>
    </view>
  </view>
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
  padding: 40rpx;
  background: #f5f7fa;
}
.logo { text-align: center; margin-bottom: 60rpx; }
.logo-text { font-size: 56rpx; font-weight: bold; color: #333; display: block; }
.logo-sub { font-size: 28rpx; color: #999; margin-top: 8rpx; display: block; }
.form { width: 100%; max-width: 600rpx; background: #fff; border-radius: 24rpx; padding: 48rpx; box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.08); }
.tab-bar { display: flex; margin-bottom: 40rpx; border-bottom: 2rpx solid #eee; }
.tab { flex: 1; text-align: center; padding-bottom: 20rpx; font-size: 32rpx; color: #999; }
.tab.active { color: #333; font-weight: bold; border-bottom: 4rpx solid #6c63ff; }
.input { width: 100%; border: 2rpx solid #eee; border-radius: 12rpx; padding: 24rpx; margin-bottom: 24rpx; font-size: 28rpx; box-sizing: border-box; }
.btn-primary { width: 100%; background: #6c63ff; color: #fff; border-radius: 12rpx; padding: 28rpx; font-size: 32rpx; border: none; margin-top: 16rpx; }
.error-msg { color: #f44336; font-size: 26rpx; margin-top: 16rpx; text-align: center; display: block; }
.placeholder { color: #bbb; }
</style>

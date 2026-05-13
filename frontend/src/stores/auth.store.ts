import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login, register } from '../api/auth.api';
import type { LoginParams, RegisterParams } from '../api/auth.api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(uni.getStorageSync('token') ?? '');
  const userEmail = ref<string>(uni.getStorageSync('userEmail') ?? '');

  const isLoggedIn = computed(() => !!token.value);

  async function doLogin(params: LoginParams) {
    const res = await login(params);
    token.value = res.token;
    userEmail.value = params.email;
    uni.setStorageSync('token', res.token);
    uni.setStorageSync('userEmail', params.email);
  }

  async function doRegister(params: RegisterParams) {
    const res = await register(params);
    token.value = res.token;
    userEmail.value = params.email;
    uni.setStorageSync('token', res.token);
    uni.setStorageSync('userEmail', params.email);
  }

  function logout() {
    token.value = '';
    userEmail.value = '';
    uni.removeStorageSync('token');
    uni.removeStorageSync('userEmail');
    uni.redirectTo({ url: '/pages/login/index' });
  }

  return { token, userEmail, isLoggedIn, doLogin, doRegister, logout };
});

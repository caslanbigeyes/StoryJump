/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, never>, Record<string, never>, any>;
  export default component;
}

declare global {
  interface UniRequestOptions {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: unknown;
    header?: Record<string, string>;
    success?: (result: { statusCode: number; data: unknown }) => void;
    fail?: (error: { errMsg?: string }) => void;
  }

  interface UniNavigateOptions {
    url: string;
  }

  interface UniToastOptions {
    title: string;
    icon?: 'success' | 'error' | 'none';
  }

  interface UniClipboardOptions {
    data: string;
  }

  interface UniAudioContext {
    src: string;
    play(): void;
  }

  interface UniLike {
    request(options: UniRequestOptions): void;
    getStorageSync(key: string): string;
    setStorageSync(key: string, value: string): void;
    removeStorageSync(key: string): void;
    redirectTo(options: UniNavigateOptions): void;
    navigateTo(options: UniNavigateOptions): void;
    switchTab(options: UniNavigateOptions): void;
    navigateBack(): void;
    showToast(options: UniToastOptions): void;
    setClipboardData(options: UniClipboardOptions): void;
    createInnerAudioContext(): UniAudioContext;
  }

  interface Window {
    uni?: UniLike;
  }

  var uni: UniLike;
}

export {};

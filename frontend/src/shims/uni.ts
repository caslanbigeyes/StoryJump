import type { Router } from 'vue-router';

function parseUrl(url: string) {
  const [path, queryString] = url.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryString ?? ''));
  return { path, query };
}

async function request(options: UniRequestOptions) {
  try {
    const response = await fetch(options.url, {
      method: options.method ?? 'GET',
      headers: options.header,
      body: options.method && options.method !== 'GET' ? JSON.stringify(options.data ?? {}) : undefined,
    });

    const text = await response.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    options.success?.({ statusCode: response.status, data });
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Network error';
    options.fail?.({ errMsg: err });
  }
}

function showToast(options: UniToastOptions) {
  if (typeof window !== 'undefined') {
    window.alert(options.title);
  }
}

function setClipboardData(options: UniClipboardOptions) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(options.data).catch(() => undefined);
  }
}

function createInnerAudioContext(): UniAudioContext {
  const audio = new Audio();
  return {
    get src() {
      return audio.src;
    },
    set src(value: string) {
      audio.src = value;
    },
    play() {
      void audio.play();
    },
  };
}

export function installUniShim(router: Router) {
  const uniLike: UniLike = {
    request,
    getStorageSync(key) {
      return window.localStorage.getItem(key) ?? '';
    },
    setStorageSync(key, value) {
      window.localStorage.setItem(key, value);
    },
    removeStorageSync(key) {
      window.localStorage.removeItem(key);
    },
    redirectTo({ url }) {
      const { path, query } = parseUrl(url);
      void router.replace({ path, query });
    },
    navigateTo({ url }) {
      const { path, query } = parseUrl(url);
      void router.push({ path, query });
    },
    switchTab({ url }) {
      const { path, query } = parseUrl(url);
      void router.replace({ path, query });
    },
    navigateBack() {
      router.back();
    },
    showToast,
    setClipboardData,
    createInnerAudioContext,
  };

  window.uni = uniLike;
  globalThis.uni = uniLike;
}

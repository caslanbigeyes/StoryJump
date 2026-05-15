/**
 * uni.request 封装，自动附加 Authorization token header
 */

function resolveBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:3010/api';
  }

  const runtimeBaseUrl =
    window.localStorage.getItem('storyjump_api_base_url') ||
    (window as typeof window & { __STORYJUMP_API_BASE_URL__?: string }).__STORYJUMP_API_BASE_URL__;
  if (runtimeBaseUrl) return runtimeBaseUrl;

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://127.0.0.1:3010/api';
  }

  return '/api';
}

const BASE_URL = resolveBaseUrl();

function getToken(): string {
  return uni.getStorageSync('token') ?? '';
}

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Record<string, unknown> | unknown;
  headers?: Record<string, string>;
}

export function request<T = unknown>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method ?? 'GET',
      data: options.data as any,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else if (res.statusCode === 401) {
          // TODO: token 失效，跳转登录
          uni.redirectTo({ url: '/pages/login/index' });
          reject(new Error('Unauthorized'));
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg ?? 'Network error'));
      },
    });
  });
}

export function get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
  const query = params
    ? '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
    : '';
  return request<T>({ url: url + query, method: 'GET' });
}

export function post<T = unknown>(url: string, data?: unknown): Promise<T> {
  return request<T>({ url, method: 'POST', data: data as Record<string, unknown> });
}

export function put<T = unknown>(url: string, data?: unknown): Promise<T> {
  return request<T>({ url, method: 'PUT', data: data as Record<string, unknown> });
}

export function del<T = unknown>(url: string): Promise<T> {
  return request<T>({ url, method: 'DELETE' });
}

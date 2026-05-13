import { post } from './request';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export function login(params: LoginParams): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/login', params);
}

export function register(params: RegisterParams): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/register', params);
}

export function getProfile() {
  // TODO: 获取当前用户信息
  return post('/users/me');
}

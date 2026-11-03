import { get, post, put } from './request'
import type { ApiResponse } from '@/types/api'
import type { LoginResult, UserInfo } from '@/types/auth'

export type { LoginResult, UserInfo }

export function login(code: string): Promise<ApiResponse<LoginResult>> {
  return post<LoginResult>('/auth/login', { code })
}

export function devLogin(code: string): Promise<ApiResponse<LoginResult>> {
  return post<LoginResult>('/auth/dev-login', { code })
}

export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  return get<UserInfo>('/auth/me')
}

export function updateProfile(data: { nickname?: string; avatar?: string; phone?: string }): Promise<ApiResponse<UserInfo>> {
  return put<UserInfo>('/auth/profile', data)
}

export function refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refresh_token: string }>> {
  return post<{ token: string; refresh_token: string }>('/auth/refresh', { refresh_token: refreshToken })
}

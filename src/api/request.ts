import type { ApiResponse } from '@/types/api'

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL
const SERVER_URL: string = BASE_URL.replace(/\/api\/v1\/?$/, '')

export function resolveImageUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function getToken(): string {
  return uni.getStorageSync('token') || ''
}

function getRefreshToken(): string {
  return uni.getStorageSync('refresh_token') || ''
}

let isRefreshing = false
let pendingQueue: Array<{ resolve: () => void; reject: (err: any) => void }> = []

function addPending(resolve: () => void, reject: (err: any) => void) {
  pendingQueue.push({ resolve, reject })
}

function flushPending(error: any) {
  const queue = pendingQueue
  pendingQueue = []
  queue.forEach(cb => error ? cb.reject(error) : cb.resolve())
}

function redirectToLogin() {
  uni.clearStorageSync()
  uni.reLaunch({ url: '/pages/login/index' })
}

function doRefresh(): Promise<boolean> {
  const rt = getRefreshToken()
  if (!rt) return Promise.resolve(false)

  return new Promise((resolve) => {
    uni.request({
      url: `${BASE_URL}/auth/refresh`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { refresh_token: rt },
      success: (res) => {
        const data = res.data as ApiResponse<{ token: string; refresh_token: string }>
        if (data.code === 0) {
          uni.setStorageSync('token', data.data.token)
          uni.setStorageSync('refresh_token', data.data.refresh_token)
          resolve(true)
        } else {
          resolve(false)
        }
      },
      fail: () => resolve(false),
    })
  })
}

export async function request<T>(options: UniApp.RequestOptions): Promise<ApiResponse<T>> {
  const token = getToken()
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.header as Record<string, string>),
  }
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      header,
      success: (res) => {
        const data = res.data as ApiResponse<T>
        if (data.code === 0) {
          resolve(data)
        } else if (data.code === 2000) {
          if (isRefreshing) {
            addPending(() => {
              request<T>(options).then(resolve).catch(reject)
            }, reject)
            return
          }

          isRefreshing = true
          doRefresh().then(ok => {
            if (ok) {
              flushPending(null)
              request<T>(options).then(resolve).catch(reject)
            } else {
              flushPending(new Error('refresh failed'))
              redirectToLogin()
              reject(new Error(data.message))
            }
          }).finally(() => {
            isRefreshing = false
          })
        } else {
          uni.showToast({ title: data.message, icon: 'none' })
          reject(new Error(data.message))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      },
    })
  })
}

export function get<T>(url: string, data?: any): Promise<ApiResponse<T>> {
  return request<T>({ url, method: 'GET', data })
}

export function post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
  return request<T>({ url, method: 'POST', data })
}

export function put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
  return request<T>({ url, method: 'PUT', data })
}

export function del<T>(url: string): Promise<ApiResponse<T>> {
  return request<T>({ url, method: 'DELETE' })
}

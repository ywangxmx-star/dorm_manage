import { get, post, put, del } from './request'
import type { ApiResponse, PageData } from '@/types/api'
import type { CreateTaskParams, Task } from '@/types/task'

export function createTask(data: CreateTaskParams): Promise<ApiResponse<Task>> {
  return post<Task>('/tasks', data)
}

export function updateTask(taskId: number, data: Partial<CreateTaskParams>): Promise<ApiResponse<Task>> {
  return put<Task>(`/tasks/${taskId}`, data)
}

export function getTaskList(params: {
  room_id?: number
  status?: number
  execute_user_id?: number
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<Task>>> {
  return get<PageData<Task>>('/tasks', params)
}

export function getTaskDetail(taskId: number): Promise<ApiResponse<Task>> {
  return get<Task>(`/tasks/${taskId}`)
}

export function acceptTask(taskId: number): Promise<ApiResponse<Task>> {
  return post<Task>(`/tasks/${taskId}/accept`)
}

export function rejectTask(taskId: number, reason: string): Promise<ApiResponse<Task>> {
  return post<Task>(`/tasks/${taskId}/reject`, { reason })
}

export function completeTask(taskId: number, data: { finish_images?: string[]; finish_remark?: string }): Promise<ApiResponse<Task>> {
  return post<Task>(`/tasks/${taskId}/complete`, data)
}

export function auditTask(taskId: number, approved: boolean, rejectReason?: string): Promise<ApiResponse<Task>> {
  return post<Task>(`/tasks/${taskId}/audit`, { approved, reject_reason: rejectReason || '' })
}

export function urgeTask(taskId: number): Promise<ApiResponse<null>> {
  return post(`/tasks/${taskId}/urge`)
}

export function cancelTask(taskId: number): Promise<ApiResponse<Task>> {
  return post<Task>(`/tasks/${taskId}/cancel`)
}

export function stopCycleTask(taskId: number): Promise<ApiResponse<Task>> {
  return post<Task>(`/tasks/${taskId}/stop-cycle`)
}

export function getDeletedTaskList(params: {
  room_id: number
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<Task>>> {
  return get<PageData<Task>>('/tasks/deleted', params)
}

export function restoreTask(taskId: number): Promise<ApiResponse<Task>> {
  return post<Task>(`/tasks/${taskId}/restore`)
}

export function deleteTask(taskId: number): Promise<ApiResponse<null>> {
  return del<null>(`/tasks/${taskId}`)
}

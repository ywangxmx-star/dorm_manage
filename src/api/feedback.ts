import { post } from './request'
import type { ApiResponse } from '@/types/api'

export function submitFeedback(data: { content: string; images?: string[] }): Promise<ApiResponse<null>> {
  return post('/feedback', data)
}

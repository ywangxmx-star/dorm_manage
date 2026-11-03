import { get, post, del } from './request'
import type { ApiResponse, PageData } from '@/types/api'
import type { CreateVoteParams, Vote } from '@/types/vote'

export function createVote(data: CreateVoteParams): Promise<ApiResponse<Vote>> {
  return post<Vote>('/votes', data)
}

export function getVoteList(params: {
  room_id: number
  status?: number
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<Vote>>> {
  return get<PageData<Vote>>('/votes', params)
}

export function getVoteDetail(voteId: number): Promise<ApiResponse<Vote>> {
  return get<Vote>(`/votes/${voteId}`)
}

export function submitVote(voteId: number, optionIds: number[]): Promise<ApiResponse<Vote>> {
  return post<Vote>(`/votes/${voteId}/submit`, { option_ids: optionIds })
}

export function closeVote(voteId: number): Promise<ApiResponse<Vote>> {
  return post<Vote>(`/votes/${voteId}/close`)
}

export function deleteVote(voteId: number): Promise<ApiResponse<null>> {
  return del<null>(`/votes/${voteId}`)
}

export function restoreVote(voteId: number): Promise<ApiResponse<Vote>> {
  return post<Vote>(`/votes/${voteId}/restore`)
}

export function getDeletedVoteList(params: {
  room_id: number
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<Vote>>> {
  return get<PageData<Vote>>('/votes/deleted', params)
}

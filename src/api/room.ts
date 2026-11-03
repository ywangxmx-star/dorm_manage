import { get, post, del } from './request'
import type { ApiResponse, PageData } from '@/types/api'
import type { CreateRoomParams, Member, Room } from '@/types/room'

export function createRoom(data: CreateRoomParams): Promise<ApiResponse<Room>> {
  return post<Room>('/rooms', data)
}

export function getMyRooms(): Promise<ApiResponse<Room[]>> {
  return get<Room[]>('/rooms')
}

export function getRoomDetail(roomId: number): Promise<ApiResponse<Room>> {
  return get<Room>(`/rooms/${roomId}`)
}

export function deleteRoom(roomId: number): Promise<ApiResponse<null>> {
  return del(`/rooms/${roomId}`)
}

export function joinRoom(roomId: number, inviteCode: string): Promise<ApiResponse<Room>> {
  return post<Room>(`/rooms/${roomId}/join`, { invite_code: inviteCode })
}

export function getMembers(roomId: number): Promise<ApiResponse<Member[]>> {
  return get<Member[]>(`/rooms/${roomId}/members`)
}

export function removeMember(roomId: number, userId: number): Promise<ApiResponse<null>> {
  return del(`/rooms/${roomId}/members/${userId}`)
}

export function leaveRoom(roomId: number): Promise<ApiResponse<null>> {
  return post(`/rooms/${roomId}/members/leave`)
}

export function transferOwnership(roomId: number, targetUserId: number): Promise<ApiResponse<Room>> {
  return post<Room>(`/rooms/${roomId}/transfer`, { target_user_id: targetUserId })
}

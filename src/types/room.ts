export interface Room {
  id: number
  room_name: string
  owner_id: number
  room_avatar: string
  notice: string
  invite_code: string | null
  max_member: number
  room_type: number
  member_count: number
  create_time: string
}

export interface Member {
  id: number
  user_id: number
  nickname: string
  avatar: string
  role: number
  status: number
  join_time: string
}

export interface CreateRoomParams {
  room_name: string
  room_avatar?: string
  notice?: string
  max_member?: number
  room_type?: number
}

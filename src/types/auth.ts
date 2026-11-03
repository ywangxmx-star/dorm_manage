export interface LoginResult {
  token: string
  refresh_token: string
  user_id: number
  nickname: string
  avatar: string
}

export interface UserInfo {
  id: number
  nickname: string
  avatar: string
  phone: string
}

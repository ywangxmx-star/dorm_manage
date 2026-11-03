export interface VoteVoter {
  user_id: number
  nickname: string
}

export interface VoteOption {
  id: number
  vote_id: number
  content: string
  sort_order: number
  vote_count: number
  voters: VoteVoter[]
}

export interface Vote {
  id: number
  room_id: number
  creator_id: number
  creator_name: string
  title: string
  description: string
  vote_type: number
  select_type: number
  select_count: number
  deadline: string
  status: number
  create_time: string
  deleted_at?: string
  options: VoteOption[]
  total_voters: number
  my_votes: number[]
  has_voted: boolean
}

export interface CreateVoteParams {
  room_id: number
  title: string
  description?: string
  vote_type?: number
  select_type?: number
  select_count?: number
  deadline: string
  options: { content: string; sort_order?: number }[]
}

export interface VoteOptionItem {
  content: string
  sort_order?: number
}

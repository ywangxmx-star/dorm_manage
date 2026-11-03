export const VOTE_TYPE_OPTIONS = [
  { value: 0, label: '匿名投票' },
  { value: 1, label: '实名投票' },
]

export const SELECT_TYPE_OPTIONS = [
  { value: 0, label: '单选' },
  { value: 1, label: '必选N项' },
  { value: 2, label: '最多选N项' },
]

export const VOTE_STATUS_OPTIONS = [
  { value: -1, label: '全部' },
  { value: 0, label: '进行中' },
  { value: 1, label: '已结束' },
]

export const VOTE_STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '进行中', color: '#2F7CF6' },
  1: { text: '已结束', color: '#9AA8BC' },
}

export const VOTE_TYPE_MAP: Record<number, string> = {
  0: '匿名',
  1: '实名',
}

export const SELECT_TYPE_MAP: Record<number, string> = {
  0: '单选',
  1: `必选`,
  2: `最多选`,
}

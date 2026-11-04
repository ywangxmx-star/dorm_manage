export interface ExecutorInfo {
  user_id: number
  nickname: string
  status: number
}

export interface Task {
  id: number
  room_id: number
  title: string
  description: string
  images: string[]
  assign_user_id: number
  assign_user_name: string
  executors: ExecutorInfo[]
  priority: number
  status: number
  deadline: string
  is_cycle: boolean
  cycle_rule: CycleRule | null
  cycle_end_date: string | null
  parent_cycle_id: number | null
  is_urged: boolean
  create_time: string
  finish_images?: string[]
  finish_remark?: string
  deleted_at?: string
}

export interface CycleRule {
  type: string
  time?: string
  weekdays?: number[]
  day_of_month?: number
  cron?: string
}

export interface CreateTaskParams {
  room_id: number
  title: string
  description?: string
  images?: string[]
  execute_user_ids: number[]
  priority?: number
  deadline: string
  is_cycle?: boolean
  cycle_rule?: CycleRule
  cycle_end_date?: string
}

export enum TaskStatus {
  PENDING_ACCEPT = 0,
  ACCEPTED = 1,
  REJECTED = 2,
  // IN_PROGRESS = 3  // 已与 ACCEPTED 合并，保留值3兼容历史数据
  PENDING_AUDIT = 4,
  COMPLETED = 5,
  OVERDUE = 6,
  REJECTED_BY_AUDIT = 7,
  CANCELLED = 8,
}

export const TaskStatusMap: Record<number, { text: string; color: string }> = {
  [TaskStatus.PENDING_ACCEPT]: { text: '待接受', color: '#D97706' },
  [TaskStatus.ACCEPTED]: { text: '进行中', color: '#2563EB' },
  [TaskStatus.REJECTED]: { text: '已拒绝', color: '#E5484D' },
  // [TaskStatus.IN_PROGRESS]: { text: '进行中', color: '#2563EB' },  // 已与 ACCEPTED 合并
  [TaskStatus.PENDING_AUDIT]: { text: '待审核', color: '#D97706' },
  [TaskStatus.COMPLETED]: { text: '已完成', color: '#12A150' },
  [TaskStatus.OVERDUE]: { text: '已超时', color: '#E5484D' },
  [TaskStatus.REJECTED_BY_AUDIT]: { text: '已驳回', color: '#E5484D' },
  [TaskStatus.CANCELLED]: { text: '已取消', color: '#94A3B8' },
  // 兼容历史数据：status=3 显示为"进行中"
  [3]: { text: '进行中', color: '#2563EB' },
}

export enum ExecutorStatus {
  PENDING_ACCEPT = 0,
  ACCEPTED = 1,
  REJECTED = 2,
  PENDING_AUDIT = 3,
  COMPLETED = 4,
  REJECTED_BY_AUDIT = 5,
}

export const ExecutorStatusMap: Record<number, { text: string; color: string }> = {
  [ExecutorStatus.PENDING_ACCEPT]: { text: '待接受', color: '#D97706' },
  [ExecutorStatus.ACCEPTED]: { text: '进行中', color: '#2563EB' },
  [ExecutorStatus.REJECTED]: { text: '已拒绝', color: '#E5484D' },
  [ExecutorStatus.PENDING_AUDIT]: { text: '待审核', color: '#D97706' },
  [ExecutorStatus.COMPLETED]: { text: '已完成', color: '#12A150' },
  [ExecutorStatus.REJECTED_BY_AUDIT]: { text: '已驳回', color: '#E5484D' },
}

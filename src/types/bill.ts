export interface Bill {
  id: number
  room_id: number
  creator_id: number
  title: string
  amount: number
  bill_type: number
  split_type: number
  images: string[]
  remark: string
  is_settled: boolean
  create_time: string
  my_should_pay?: number
  my_pay_status?: number
  deleted_at?: string
}

export interface BillSplit {
  id: number
  bill_id: number
  user_id: number
  nickname?: string
  should_pay: number
  paid_amount: number
  pay_status: number
  pay_time: string | null
}

export interface BillWithSplits extends Bill {
  splits: BillSplit[]
}

export interface CreateBillParams {
  room_id: number
  title: string
  amount: number
  bill_type?: number
  split_type?: number
  images?: string[]
  remark?: string
  split_members?: { user_id: number; amount?: number; ratio?: number }[]
}

export enum BillType {
  UTILITY = 0,
  PURCHASE = 1,
  DINNER = 2,
  INTERNET = 3,
  OTHER = 4,
}

export const BillTypeMap: Record<number, string> = {
  [BillType.UTILITY]: '水电',
  [BillType.PURCHASE]: '采购',
  [BillType.DINNER]: '聚餐',
  [BillType.INTERNET]: '网费',
  [BillType.OTHER]: '其他',
}

export enum SplitType {
  EQUAL = 0,
  CUSTOM = 1,
  RATIO = 2,
}

export const SplitTypeMap: Record<number, string> = {
  [SplitType.EQUAL]: 'AA均分',
  [SplitType.CUSTOM]: '自定义金额',
  [SplitType.RATIO]: '按百分比',
}

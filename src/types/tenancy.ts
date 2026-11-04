export interface Lease {
  id: number
  room_id: number
  address: string
  landlord_name: string
  landlord_phone: string
  lease_start: string | null
  lease_end: string | null
  rent_amount: string | null
  deposit_amount: string | null
  payment_cycle: number
  rent_due_day: number
  water_meter_start: string
  electric_meter_start: string
  gas_meter_start: string
  remark: string
  status: number
  create_time: string
}

export interface LeaseUpsertParams {
  address?: string
  landlord_name?: string
  landlord_phone?: string
  lease_start?: string | null
  lease_end?: string | null
  rent_amount?: string | null
  deposit_amount?: string | null
  payment_cycle?: number
  rent_due_day?: number
  water_meter_start?: string
  electric_meter_start?: string
  gas_meter_start?: string
  remark?: string
  status?: number
}

export interface InspectItem {
  id: number
  item_key: string
  title: string
  group_name: string
  result: number
  images: string[]
  meter_value: string | null
  remark: string
  sort: number
}

export interface InspectConfirm {
  user_id: number
  nickname: string
  status: number
  confirm_time: string | null
}

export interface InspectOrder {
  id: number
  room_id: number
  creator_id: number
  inspect_type: number
  status: number
  create_time: string
  submit_time: string | null
  effective_time: string | null
  confirm_total: number
  confirm_done: number
}

export interface InspectOrderDetail extends InspectOrder {
  items: InspectItem[]
  confirms: InspectConfirm[]
}

export interface InspectItemInput {
  item_key: string
  title?: string
  group_name?: string
  result?: number
  images?: string[]
  meter_value?: string | null
  remark?: string
  sort?: number
}

export interface InspectTemplate {
  template_key: string
  title: string
  groups: { group: string; items: { item_key: string; title: string; meter_required?: boolean }[] }[]
}

export interface RentBill {
  id: number
  room_id: number
  creator_id: number
  lease_id: number | null
  title: string
  amount: string
  rent_type: number
  period_start: string | null
  period_end: string | null
  due_date: string | null
  split_type: number
  images: string[]
  remark: string
  is_settled: boolean
  source: number
  create_time: string
  my_should_pay: string | null
  my_pay_status: number | null
}

export interface RentBillSplit {
  id: number
  rent_bill_id: number
  user_id: number
  nickname: string
  should_pay: string
  paid_amount: string
  pay_status: number
  pay_time: string | null
}

export interface RentBillWithSplits extends RentBill {
  splits: RentBillSplit[]
}

export interface CreateRentBillParams {
  room_id: number
  title: string
  amount: string
  rent_type?: number
  period_start?: string | null
  period_end?: string | null
  due_date?: string | null
  split_type?: number
  images?: string[]
  remark?: string
  split_members?: { user_id: number; amount?: string; ratio?: number }[]
}

export interface CheckoutItem {
  id: number
  item_key: string
  title: string
  group_name: string
  checkin_result: number | null
  checkin_images: string[]
  checkin_meter_value: string | null
  checkout_result: number
  checkout_meter_value: string | null
  images: string[]
  is_damaged: boolean
  is_repaired: boolean | null
  remark: string
  diff_type: string
}

export interface CheckoutConfirm {
  user_id: number
  nickname: string
  is_required: boolean
  status: number
  confirm_time: string | null
}

export interface CheckoutOrder {
  id: number
  room_id: number
  creator_id: number
  inspect_order_id: number | null
  status: number
  damage_count: number
  dispute_reason: string
  create_time: string
  complete_time: string | null
  confirm_total: number
  confirm_done: number
}

export interface CheckoutOrderDetail extends CheckoutOrder {
  items: CheckoutItem[]
  confirms: CheckoutConfirm[]
}

export interface CheckoutItemInput {
  item_key: string
  checkout_result?: number
  checkout_meter_value?: string | null
  images?: string[]
  is_damaged?: boolean
  is_repaired?: boolean | null
  remark?: string
}

export interface ExportJob {
  id: number
  room_id: number
  creator_id: number
  modules: string[]
  related_to_me: boolean
  status: number
  file_size: number
  fail_reason: string
  retry_count: number
  create_time: string
  expire_at: string | null
  download_url: string | null
}

export interface AppNotification {
  id: number
  room_id: number | null
  type: number
  title: string
  content: string
  biz_type: string
  biz_id: number | null
  is_read: boolean
  create_time: string
}

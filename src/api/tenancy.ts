import { get, post, put, del } from './request'
import type { ApiResponse, PageData } from '@/types/api'
import type {
  Lease,
  LeaseUpsertParams,
  InspectOrder,
  InspectOrderDetail,
  InspectTemplate,
  InspectItemInput,
  RentBill,
  RentBillWithSplits,
  CreateRentBillParams,
  RentBillSplit,
  CheckoutOrder,
  CheckoutOrderDetail,
  CheckoutItemInput,
  ExportJob,
  AppNotification,
} from '@/types/tenancy'

// 租约
export function getLease(roomId: number): Promise<ApiResponse<Lease | null>> {
  return get<Lease | null>(`/rooms/${roomId}/lease`)
}

export function upsertLease(roomId: number, data: LeaseUpsertParams): Promise<ApiResponse<Lease>> {
  return put<Lease>(`/rooms/${roomId}/lease`, data)
}

// 验房
export function getInspectTemplates(): Promise<ApiResponse<InspectTemplate[]>> {
  return get<InspectTemplate[]>('/inspects/templates')
}

export function getInspectList(params: {
  room_id: number
  status?: number
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<InspectOrder>>> {
  return get<PageData<InspectOrder>>('/inspects', params)
}

export function createInspect(data: {
  room_id: number
  template_key?: string
  items?: InspectItemInput[]
}): Promise<ApiResponse<InspectOrderDetail>> {
  return post<InspectOrderDetail>('/inspects', data)
}

export function getInspectDetail(orderId: number): Promise<ApiResponse<InspectOrderDetail>> {
  return get<InspectOrderDetail>(`/inspects/${orderId}`)
}

export function updateInspect(orderId: number, items: InspectItemInput[]): Promise<ApiResponse<InspectOrderDetail>> {
  return put<InspectOrderDetail>(`/inspects/${orderId}`, { items })
}

export function submitInspect(orderId: number): Promise<ApiResponse<InspectOrderDetail>> {
  return post<InspectOrderDetail>(`/inspects/${orderId}/submit`)
}

export function confirmInspect(orderId: number): Promise<ApiResponse<InspectOrderDetail>> {
  return post<InspectOrderDetail>(`/inspects/${orderId}/confirm`)
}

export function voidInspect(orderId: number): Promise<ApiResponse<null>> {
  return post<null>(`/inspects/${orderId}/void`)
}

// 租房账单
export function getRentBillList(params: {
  room_id: number
  rent_type?: number
  is_settled?: boolean
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<RentBill>>> {
  return get<PageData<RentBill>>('/rent-bills', params)
}

export function createRentBill(data: CreateRentBillParams): Promise<ApiResponse<RentBillWithSplits>> {
  return post<RentBillWithSplits>('/rent-bills', data)
}

export function generateRentBills(roomId: number, periods = 1): Promise<ApiResponse<RentBillWithSplits[]>> {
  return post<RentBillWithSplits[]>('/rent-bills/generate', { room_id: roomId, periods })
}

export function getRentBillDetail(billId: number): Promise<ApiResponse<RentBillWithSplits>> {
  return get<RentBillWithSplits>(`/rent-bills/${billId}`)
}

export function deleteRentBill(billId: number): Promise<ApiResponse<null>> {
  return del<null>(`/rent-bills/${billId}`)
}

export function payRentBill(billId: number): Promise<ApiResponse<RentBillSplit>> {
  return post<RentBillSplit>(`/rent-bills/${billId}/pay`)
}

// 退租
export function getCheckoutList(params: {
  room_id: number
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<CheckoutOrder>>> {
  return get<PageData<CheckoutOrder>>('/checkouts', params)
}

export function createCheckout(data: {
  room_id: number
  inspect_order_id?: number
  use_blank?: boolean
  required_confirm_user_ids?: number[]
}): Promise<ApiResponse<CheckoutOrderDetail>> {
  return post<CheckoutOrderDetail>('/checkouts', data)
}

export function getCheckoutDetail(checkoutId: number): Promise<ApiResponse<CheckoutOrderDetail>> {
  return get<CheckoutOrderDetail>(`/checkouts/${checkoutId}`)
}

export function updateCheckoutItems(checkoutId: number, items: CheckoutItemInput[]): Promise<ApiResponse<CheckoutOrderDetail>> {
  return put<CheckoutOrderDetail>(`/checkouts/${checkoutId}/items`, { items })
}

export function submitCheckout(checkoutId: number): Promise<ApiResponse<CheckoutOrderDetail>> {
  return post<CheckoutOrderDetail>(`/checkouts/${checkoutId}/submit`)
}

export function confirmCheckout(checkoutId: number): Promise<ApiResponse<CheckoutOrderDetail>> {
  return post<CheckoutOrderDetail>(`/checkouts/${checkoutId}/confirm`)
}

export function disputeCheckout(checkoutId: number, reason: string): Promise<ApiResponse<CheckoutOrderDetail>> {
  return post<CheckoutOrderDetail>(`/checkouts/${checkoutId}/dispute`, { reason })
}

export function completeCheckout(checkoutId: number): Promise<ApiResponse<CheckoutOrderDetail>> {
  return post<CheckoutOrderDetail>(`/checkouts/${checkoutId}/complete`)
}

export function cancelCheckout(checkoutId: number): Promise<ApiResponse<null>> {
  return post<null>(`/checkouts/${checkoutId}/cancel`)
}

// 导出
export function createExport(data: {
  room_id: number
  modules: string[]
  related_to_me?: boolean
  date_start?: string
  date_end?: string
}): Promise<ApiResponse<ExportJob>> {
  return post<ExportJob>('/exports', data)
}

export function getExportList(params: {
  room_id: number
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<ExportJob>>> {
  return get<PageData<ExportJob>>('/exports', params)
}

export function getExportDetail(jobId: number): Promise<ApiResponse<ExportJob>> {
  return get<ExportJob>(`/exports/${jobId}`)
}

export function retryExport(jobId: number): Promise<ApiResponse<ExportJob>> {
  return post<ExportJob>(`/exports/${jobId}/retry`)
}

// 通知
export function getNotificationList(params: {
  is_read?: boolean
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<AppNotification>>> {
  return get<PageData<AppNotification>>('/notifications', params)
}

export function getUnreadCount(): Promise<ApiResponse<number>> {
  return get<number>('/notifications/unread-count')
}

export function markNotificationsRead(ids: number[] = [], readAll = false): Promise<ApiResponse<null>> {
  return post<null>('/notifications/read', { ids, read_all: readAll })
}

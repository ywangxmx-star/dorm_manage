import { get, post, del } from './request'
import type { ApiResponse, PageData } from '@/types/api'
import type { Bill, BillSplit, BillWithSplits, CreateBillParams } from '@/types/bill'

export function createBill(data: CreateBillParams): Promise<ApiResponse<BillWithSplits>> {
  return post<BillWithSplits>('/bills', data)
}

export function getBillList(params: {
  room_id: number
  is_settled?: boolean
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<Bill>>> {
  return get<PageData<Bill>>('/bills', params)
}

export function getBillDetail(billId: number): Promise<ApiResponse<BillWithSplits>> {
  return get<BillWithSplits>(`/bills/${billId}`)
}

export function payBill(billId: number): Promise<ApiResponse<BillSplit>> {
  return post<BillSplit>(`/bills/${billId}/pay`)
}

export function getDeletedBillList(params: {
  room_id: number
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<Bill>>> {
  return get<PageData<Bill>>('/bills/deleted', params)
}

export function restoreBill(billId: number): Promise<ApiResponse<BillWithSplits>> {
  return post<BillWithSplits>(`/bills/${billId}/restore`)
}

export function deleteBill(billId: number): Promise<ApiResponse<null>> {
  return del<null>(`/bills/${billId}`)
}

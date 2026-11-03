export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageData<T = any> {
  total: number
  page: number
  page_size: number
  items: T[]
}

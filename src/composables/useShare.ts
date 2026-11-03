import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

export interface ShareOptions {
  title: string
  path: string
  imageUrl?: string
}

export const DEFAULT_SHARE: ShareOptions = {
  title: '舍小圈 - 宿舍协同管理',
  path: '/pages/home/index',
  imageUrl: '/static/icons/app.png',
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path
}

function extractQuery(path: string): string {
  const idx = path.indexOf('?')
  return idx >= 0 ? path.slice(idx + 1) : ''
}

export function useShare(getOptions?: () => ShareOptions) {
  // #ifdef MP-WEIXIN
  const resolve = () => getOptions?.() ?? DEFAULT_SHARE

  onShareAppMessage(() => {
    const { title, path, imageUrl } = resolve()
    return { title, path: normalizePath(path), imageUrl }
  })

  onShareTimeline(() => {
    const { title, path, imageUrl } = resolve()
    return { title, query: extractQuery(path), imageUrl }
  })
  // #endif
}

import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { DEFAULT_SHARE } from '@/composables/useShare'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // #ifdef MP-WEIXIN
  app.mixin({
    onShow() {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline'],
      })
    },
    onShareAppMessage() {
      return {
        title: DEFAULT_SHARE.title,
        path: DEFAULT_SHARE.path.replace(/^\//, ''),
        imageUrl: DEFAULT_SHARE.imageUrl,
      }
    },
    onShareTimeline() {
      return {
        title: DEFAULT_SHARE.title,
        imageUrl: DEFAULT_SHARE.imageUrl,
      }
    },
  })
  // #endif

  return { app }
}

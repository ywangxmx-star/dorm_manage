import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { storeToRefs } from 'pinia'

export function useAuth() {
  const authStore = useAuthStore()
  const roomStore = useRoomStore()
  const { isLoggedIn, userInfo } = storeToRefs(authStore)

  function wxLogin(): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: async (res) => {
          if (res.code) {
            try {
              await authStore.login(res.code)
              await roomStore.fetchMyRooms()
              uni.switchTab({ url: '/pages/home/index' })
              resolve()
            } catch (err: any) {
              const msg = err?.message || '登录失败'
              uni.showToast({ title: msg, icon: 'none' })
              reject(new Error(msg))
            }
          } else {
            uni.showToast({ title: '获取登录凭证失败', icon: 'none' })
            reject(new Error('获取code失败'))
          }
        },
        fail: (err) => {
          console.error('uni.login fail:', err)
          uni.showToast({ title: '微信登录调用失败', icon: 'none' })
          reject(new Error('微信登录失败'))
        },
      })
    })
  }

  return { wxLogin, isLoggedIn, userInfo }
}

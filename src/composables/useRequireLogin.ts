import { useAuthStore } from '@/stores/auth'

const LOGIN_PATH = '/pages/login/index'

export function useRequireLogin() {
  const authStore = useAuthStore()

  function requireLogin(action: () => void) {
    if (authStore.isLoggedIn) {
      action()
      return
    }
    uni.showModal({
      title: '需要登录',
      content: '该功能需要登录后使用，是否前往登录？',
      cancelText: '暂不登录',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: LOGIN_PATH })
        }
      },
    })
  }

  return { requireLogin }
}

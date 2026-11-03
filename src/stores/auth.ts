import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, getUserInfo as getUserInfoApi, updateProfile as updateProfileApi, refreshToken as refreshTokenApi } from '@/api/auth'
import { useRoomStore } from '@/stores/room'
import type { LoginResult, UserInfo } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const refreshTokenValue = ref('')
  const userInfo = ref<UserInfo | null>(null)
  const isLoggedIn = ref(false)

  function checkLogin() {
    const savedToken = uni.getStorageSync('token')
    const savedRefreshToken = uni.getStorageSync('refresh_token')
    if (savedToken) {
      token.value = savedToken
      refreshTokenValue.value = savedRefreshToken || ''
      isLoggedIn.value = true
      fetchUserInfo()
    }
  }

  function setLoginData(data: LoginResult) {
    token.value = data.token
    refreshTokenValue.value = data.refresh_token
    userInfo.value = {
      id: data.user_id,
      nickname: data.nickname,
      avatar: data.avatar,
      phone: '',
    }
    isLoggedIn.value = true
    uni.setStorageSync('token', data.token)
    uni.setStorageSync('refresh_token', data.refresh_token)
    uni.setStorageSync('userInfo', JSON.stringify(userInfo.value))
    useRoomStore().clearRooms()
  }

  async function login(code: string) {
    const res = await loginApi(code)
    setLoginData(res.data)
  }

  async function refreshAccessToken(): Promise<boolean> {
    const rt = refreshTokenValue.value || uni.getStorageSync('refresh_token')
    if (!rt) return false
    try {
      const res = await refreshTokenApi(rt)
      token.value = res.data.token
      refreshTokenValue.value = res.data.refresh_token
      uni.setStorageSync('token', res.data.token)
      uni.setStorageSync('refresh_token', res.data.refresh_token)
      return true
    } catch {
      return false
    }
  }

  async function fetchUserInfo() {
    try {
      const res = await getUserInfoApi()
      userInfo.value = res.data
      uni.setStorageSync('userInfo', JSON.stringify(res.data))
    } catch {
      // ignore
    }
  }

  async function updateProfile(data: { nickname?: string; avatar?: string; phone?: string }) {
    const res = await updateProfileApi(data)
    userInfo.value = res.data
    uni.setStorageSync('userInfo', JSON.stringify(res.data))
    return res.data
  }

  function logout() {
    token.value = ''
    refreshTokenValue.value = ''
    userInfo.value = null
    isLoggedIn.value = false
    uni.clearStorageSync()
    useRoomStore().clearRooms()
    uni.reLaunch({ url: '/pages/mine/index' })
  }

  return {
    token,
    refreshTokenValue,
    userInfo,
    isLoggedIn,
    checkLogin,
    login,
    setLoginData,
    refreshAccessToken,
    fetchUserInfo,
    updateProfile,
    logout,
  }
})

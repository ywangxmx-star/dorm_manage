<template>
  <view class="login-page">
    <view class="login-center">
      <view class="login-hero">
        <view class="logo-wrap">
          <image class="logo-img" src="/static/icons/app.png" mode="aspectFit" />
        </view>
        <text class="app-title">舍小圈</text>
        <text class="app-slogan">宿舍那点事，</text>
        <text class="app-slogan app-slogan--hl">一个圈就够了</text>
        <text class="app-desc">学生宿舍、员工公寓、合租小窝都适用</text>

        <view class="stickers">
          <view class="sticker sticker--blue">
            <image class="sticker-icon" src="/static/icons/task.png" mode="aspectFit" />
            <text class="sticker-text">值日分工</text>
          </view>
          <view class="sticker sticker--lemon">
            <image class="sticker-icon" src="/static/icons/wallet-sm.png" mode="aspectFit" />
            <text class="sticker-text">AA 记账</text>
          </view>
          <view class="sticker sticker--mint">
            <image class="sticker-icon" src="/static/icons/vote.png" mode="aspectFit" />
            <text class="sticker-text">一起投票</text>
          </view>
        </view>
      </view>

      <view class="login-body">
        <view class="btn-wechat" :class="{ 'is-loading': isLoading }" @click="handleLogin">
          <text v-if="!isLoading">微信一键登录</text>
          <view v-else class="loading-spinner"></view>
        </view>
        <view class="btn-cancel" :class="{ 'is-disabled': isLoading }" @click="!isLoading && handleCancelLogin()">先逛逛</view>
        <view class="login-agreement" @tap="agreed = !agreed">
          <view class="agreement-check" :class="{ 'is-checked': agreed }">
            <text v-if="agreed" class="agreement-check-icon">✓</text>
          </view>
          <view class="agreement-label">
            <text class="agreement-text">我已阅读并同意</text>
            <text class="agreement-link" @tap.stop="openAgreement">《用户协议》</text>
            <text class="agreement-text">和</text>
            <text class="agreement-link" @tap.stop="openPrivacy">《隐私政策》</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
// import { devLogin } from '@/api/auth'
// import { useAuthStore } from '@/stores/auth'
// import { useRoomStore } from '@/stores/room'

const { wxLogin } = useAuth()
// const authStore = useAuthStore()
// const roomStore = useRoomStore()
const isLoading = ref(false)
const agreed = ref(false)

function openAgreement() {
  uni.navigateTo({ url: '/pages/login/agreement' })
}

function openPrivacy() {
  uni.navigateTo({ url: '/pages/login/privacy' })
}

async function handleLogin() {
  if (isLoading.value) return
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
    return
  }
  isLoading.value = true
  try {
    await wxLogin()
  } finally {
    isLoading.value = false
  }
}

function handleCancelLogin() {
  if (isLoading.value) return
  uni.navigateBack({
    fail: () => {
      uni.switchTab({ url: '/pages/home/index' })
    },
  })
}

// function handleDevLogin() {
//   uni.showModal({
//     title: '开发登录',
//     editable: true,
//     placeholderText: '输入用户标识（如 user1、user2）',
//     success: async (res) => {
//       if (res.confirm && res.content) {
//         isLoading.value = true
//         try {
//           const loginRes = await devLogin(res.content)
//           authStore.setLoginData(loginRes.data)
//           await roomStore.fetchMyRooms()
//           uni.switchTab({ url: '/pages/home/index' })
//         } catch {
//           uni.showToast({ title: '登录失败', icon: 'none' })
//         } finally {
//           isLoading.value = false
//         }
//       }
//     },
//   })
// }
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.login-page {
  min-height: 100vh;
  background: $bg-page;
  display: flex;
  flex-direction: column;
}

.login-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 140rpx) $space-6 calc(env(safe-area-inset-bottom) + 60rpx);
}

.login-hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo-wrap {
  width: 128rpx;
  height: 128rpx;
  border-radius: 40rpx;
  background: $bg-card;
  box-shadow: $shadow-md;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $space-4;
}

.logo-img {
  width: 88rpx;
  height: 88rpx;
}

.app-title {
  font-size: $font-sm;
  font-weight: 800;
  color: $primary;
  letter-spacing: 0.1em;
  margin-bottom: $space-2;
}

.app-slogan {
  font-size: 64rpx;
  font-weight: 900;
  color: $text-primary;
  line-height: 1.2;
  letter-spacing: -0.02em;

  &--hl {
    color: $primary;
    background: linear-gradient(transparent 62%, $accent-lemon 62%);
  }
}

.app-desc {
  margin-top: $space-3;
  font-size: $font-sm;
  color: $text-secondary;
}

.stickers {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  margin-top: $space-6;
}

.sticker {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 28rpx;
  border-radius: $radius-full;

  &--blue { background: $primary-bg; transform: rotate(-3deg); }
  &--lemon { background: $accent-lemon; transform: rotate(2deg); }
  &--mint { background: $success-bg; transform: rotate(-1deg); }

  &-icon {
    width: 32rpx;
    height: 32rpx;
  }

  &-text {
    font-size: $font-sm;
    font-weight: 800;
    color: $text-primary;
  }
}

.login-body {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.btn-wechat {
  height: 104rpx;
  border-radius: $radius-full;
  background: $primary;
  color: $text-white;
  font-size: $font-md;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-primary;

  &:active {
    transform: scale(0.98);
  }

  &.is-loading {
    opacity: 0.8;
  }
}

.btn-cancel {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-sm;
  font-weight: 700;
  color: $text-secondary;

  &.is-disabled {
    opacity: 0.5;
  }
}

.login-agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.agreement-check {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 3rpx solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.is-checked {
    background: $primary;
    border-color: $primary;
  }

  &-icon {
    font-size: 20rpx;
    color: $text-white;
    font-weight: 900;
  }
}

.agreement-label {
  display: flex;
  flex-wrap: wrap;
}

.agreement-text {
  font-size: 22rpx;
  color: $text-hint;
}

.agreement-link {
  font-size: 22rpx;
  color: $primary;
  font-weight: 700;
}
</style>

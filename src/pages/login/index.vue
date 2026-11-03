<template>
  <view class="login-page">
    <view class="login-decor login-decor--1"></view>
    <view class="login-decor login-decor--2"></view>

    <view class="login-center">
      <view class="login-hero">
        <view class="login-top">
          <view class="logo-wrap">
            <image class="logo-img" src="/static/icons/app.png" mode="aspectFit" />
          </view>
          <text class="app-title">舍小圈</text>
          <text class="app-desc">一起经营小窝</text>
        </view>

        <view class="login-features">
          <view class="feature-item">
            <view class="feature-icon feature-icon--task">
              <image class="feature-icon-img" src="/static/icons/task.png" mode="aspectFit" />
            </view>
            <text class="feature-text">任务协作</text>
          </view>
          <view class="feature-item">
            <view class="feature-icon feature-icon--bill">
              <image class="feature-icon-img" src="/static/icons/wallet-sm.png" mode="aspectFit" />
            </view>
            <text class="feature-text">账单分摊</text>
          </view>
          <view class="feature-item">
            <view class="feature-icon feature-icon--vote">
              <image class="feature-icon-img" src="/static/icons/vote.png" mode="aspectFit" />
            </view>
            <text class="feature-text">民主投票</text>
          </view>
        </view>
      </view>

      <view class="login-body">
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
        <button class="btn-wechat" :class="{ 'is-loading': isLoading }" @click="handleLogin">
          <text v-if="!isLoading">微信一键登录</text>
          <view v-else class="loading-spinner"></view>
        </button>
        <button class="btn-cancel" :disabled="isLoading" @click="handleCancelLogin">取消登录</button>
        <!-- <view class="dev-login" @click="handleDevLogin">
          <text class="dev-login-text">开发登录</text>
        </view> -->
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
  height: 100vh;
  background: linear-gradient(180deg, #F2F7FF 0%, #FFFFFF 40%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.login-decor {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;

  &--1 {
    top: -160rpx;
    right: -100rpx;
    width: 500rpx;
    height: 500rpx;
    background: radial-gradient(circle, rgba($primary, 0.08) 0%, transparent 70%);
  }

  &--2 {
    bottom: 200rpx;
    left: -200rpx;
    width: 400rpx;
    height: 400rpx;
    background: radial-gradient(circle, rgba($success, 0.06) 0%, transparent 70%);
  }
}

.login-center {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: calc(var(--status-bar-height) + 40rpx) $space-8 $space-10;
  box-sizing: border-box;
}

.login-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.login-top {
  text-align: center;
}

.logo-wrap {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-xl;
  background: $primary-gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto $space-6;
  box-shadow: 0 16rpx 48rpx rgba(47, 124, 246, 0.25);
}

.logo-img {
  width: 80rpx;
  height: 80rpx;
}

.app-title {
  font-size: 52rpx;
  font-weight: 800;
  color: $text-primary;
  display: block;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.app-desc {
  font-size: $font-base;
  color: $text-hint;
  margin-top: $space-2;
  display: block;
}

.login-features {
  display: flex;
  justify-content: center;
  gap: $space-8;
  margin-top: $space-10;
  padding: $space-6 0;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.feature-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;

  &-img {
    width: 40rpx;
    height: 40rpx;
  }

  &--task {
    background: linear-gradient(135deg, #EAF2FF, #DCEBFF);
  }

  &--bill {
    background: linear-gradient(135deg, #E8FAF2, #CFF5E6);
  }

  &--vote {
    background: linear-gradient(135deg, #F0FDFA, #CCFBF1);
  }
}

.feature-text {
  font-size: $font-xs;
  color: $text-hint;
  font-weight: 500;
}

.login-body {
  text-align: center;
}

.btn-wechat {
  background: linear-gradient(135deg, #07C160, #06AD56);
  color: $text-white;
  border-radius: $radius-xl;
  padding: $space-5;
  font-size: $font-base;
  font-weight: 700;
  border: none;
  transition: $transition-base;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100rpx;
  box-shadow: 0 8rpx 32rpx rgba(7, 193, 96, 0.3);
  letter-spacing: 0.02em;

  &:active {
    opacity: 0.85;
  }

  &.is-loading {
    opacity: 0.7;
    pointer-events: none;
  }
}

.btn-cancel {
  margin-top: $space-4;
  width: 100%;
  height: 100rpx;
  background: $bg-card;
  color: $text-primary;
  border: 2rpx solid $border-color;
  border-radius: $radius-xl;
  font-size: $font-base;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;

  &:active {
    background: $bg-hover;
  }

  &[disabled] {
    opacity: 0.5;
    pointer-events: none;
  }
}

.login-agreement {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  margin-bottom: $space-5;
  text-align: left;
}

.agreement-check {
  flex-shrink: 0;
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid $border-color;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4rpx;
  background: $bg-card;

  &.is-checked {
    background: $primary;
    border-color: $primary;
  }
}

.agreement-check-icon {
  font-size: 22rpx;
  color: $text-white;
  line-height: 1;
}

.agreement-label {
  flex: 1;
  line-height: 1.6;
}

.agreement-text {
  font-size: $font-xs;
  color: $text-hint;
}

.agreement-link {
  font-size: $font-xs;
  color: $primary;
  font-weight: 500;
}

// .dev-login {
//   margin-top: $space-6;
//   padding: $space-3 $space-5;
//
//   .dev-login-text {
//     font-size: $font-xs;
//     color: $border-color;
//   }
// }

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

<template>
  <view class="join-page">
    <view class="join-content card slide-up">
      <view class="join-icon">
        <image class="join-icon-img" src="/static/icons/app.png" mode="aspectFit" />
      </view>
      <text class="join-title">加入宿舍</text>
      <text class="join-desc">输入邀请码加入一个宿舍</text>
      <input
        v-model="inviteCode"
        class="code-input"
        placeholder="请输入邀请码"
        maxlength="16"
      />
      <button class="btn-primary" :class="{ 'is-loading': submitting }" :disabled="!inviteCode" @click="handleJoin">
        <text v-if="!submitting">加入宿舍</text>
        <view v-else class="loading-spinner spinner-sm"></view>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { joinRoom } from '@/api/room'
import { useRoomStore } from '@/stores/room'

const roomStore = useRoomStore()
const inviteCode = ref('')
const submitting = ref(false)

onLoad((options) => {
  if (options?.code) {
    inviteCode.value = options.code
  }
})

async function handleJoin() {
  if (!inviteCode.value || submitting.value) return
  submitting.value = true
  try {
    await joinRoom(0, inviteCode.value)
    await roomStore.fetchMyRooms()
    uni.showToast({ title: '加入成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch { /* handled */ } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.join-page {
  padding: $space-4;
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: $bg-page;
}

.join-content {
  text-align: center;
  padding: $space-10 $space-6;
  width: 100%;
  background: $bg-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-md;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: $primary;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  &::before {
    content: '';
    position: absolute;
    top: -40rpx;
    right: -40rpx;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: $primary;
    opacity: 0.06;
    pointer-events: none;
  }

  .join-icon {
    margin-bottom: $space-5;

    .join-icon-img {
      width: 100rpx;
      height: 100rpx;
    }
  }

  .join-title {
    font-size: $font-lg;
    font-weight: 700;
    color: $text-primary;
    display: block;
    margin-bottom: $space-2;
  }

  .join-desc {
    font-size: $font-sm;
    color: $text-secondary;
    display: block;
    margin-bottom: $space-8;
  }

  .code-input {
    height: 100rpx;
    padding: 0 $space-5;
    border: 2rpx solid $border-color;
    border-radius: $radius-lg;
    font-size: $font-lg;
    text-align: center;
    letter-spacing: 12rpx;
    font-weight: 600;
    color: $text-primary;
    transition: $transition-fast;
    margin-bottom: $space-6;
    background-color: $bg-page;

    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 4rpx $primary-bg;
    }
  }

  .btn-primary {
    width: 100%;
    min-height: 96rpx;
  }
}
</style>

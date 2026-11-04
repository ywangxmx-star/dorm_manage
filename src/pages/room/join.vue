<template>
  <view class="join-page">
    <view class="ui-panel join-card">
      <view class="join-icon">
        <image class="join-icon-img" src="/static/icons/app.png" mode="aspectFit" />
      </view>
      <text class="join-title">加入宿舍</text>
      <text class="join-desc">向宿舍长索取邀请码，输入后即可加入</text>
      <input
        v-model="inviteCode"
        class="code-input"
        placeholder="请输入邀请码"
        placeholder-class="code-placeholder"
        maxlength="16"
      />
      <view class="ui-btn ui-btn--primary join-btn" :class="{ 'is-disabled': !inviteCode || submitting }" @click="inviteCode && !submitting && handleJoin()">
        {{ submitting ? '加入中...' : '加入宿舍' }}
      </view>
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
  min-height: 100vh;
  background: $bg-page;
  padding: $space-6 $page-gutter;
  box-sizing: border-box;
}

.join-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-6 $space-5;
}

.join-icon {
  width: 112rpx;
  height: 112rpx;
  border-radius: $radius-lg;
  background: $primary-bg;
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-icon-img {
  width: 64rpx;
  height: 64rpx;
}

.join-title {
  margin-top: $space-4;
  font-size: $font-lg;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.3;
}

.join-desc {
  margin-top: $space-1;
  font-size: $font-xs;
  color: $text-secondary;
  line-height: 1.5;
  text-align: center;
}

.code-input {
  width: 100%;
  height: 104rpx;
  margin-top: $space-5;
  padding: 0 $space-3;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  background: $bg-subtle;
  font-family: $font-num;
  font-size: $font-lg;
  font-weight: 600;
  letter-spacing: 8rpx;
  text-align: center;
  color: $text-primary;
  caret-color: $primary;
}

:deep(.code-placeholder) {
  font-family: inherit;
  font-size: $font-base;
  font-weight: 400;
  letter-spacing: 0;
  color: $text-hint;
}

.join-btn {
  flex: none;
  width: 100%;
  margin-top: $space-4;
}
</style>

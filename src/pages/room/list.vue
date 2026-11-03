<template>
  <view class="room-list-page">
  <PageLoading v-if="loading" />
  <template v-else-if="myRooms.length > 0">
    <view class="ui-header">
      <text class="ui-header__eyebrow">MY ROOMS</text>
      <view class="ui-header__row">
        <text class="ui-header__title">我的宿舍</text>
      </view>
      <text class="head-sub">已加入 {{ myRooms.length }} 个 · 共 {{ totalMembers }} 位室友</text>
    </view>

    <view class="room-list">
      <view
        v-for="(room, index) in myRooms"
        :key="room.id"
        class="room slide-up"
        :class="{ 'is-active': room.id === currentRoom?.id }"
        :style="{ animationDelay: index * 50 + 'ms' }"
        @click="goRoomDetail(room)"
      >
        <view class="room-top">
          <view class="room-avatar" :style="{ background: getAvatarColor(room.room_name) }">
            <text class="room-avatar-text">{{ room.room_name.charAt(0) }}</text>
          </view>
          <view class="room-body">
            <text class="room-name">{{ room.room_name }}</text>
            <view class="room-meta">
              <text class="room-type" :class="`room-type--${room.room_type}`">{{ getRoomTypeText(room.room_type) }}</text>
              <text class="room-count">{{ room.member_count }}/{{ room.max_member }} 人</text>
            </view>
          </view>
          <view v-if="room.id === currentRoom?.id" class="room-current">当前</view>
          <text v-else class="room-arrow">›</text>
        </view>
        <view v-if="room.notice" class="room-notice">
          <text class="room-notice-text">{{ room.notice }}</text>
        </view>
      </view>
    </view>
    <view class="ui-bottom-spacer"></view>
  </template>

  <view class="empty-room" v-else>
    <view class="empty-icon">
      <image class="empty-img" src="/static/icons/home.png" mode="aspectFit" />
    </view>
    <text class="empty-title">还没有加入任何宿舍</text>
    <text class="empty-desc">新建一个宿舍邀请室友，或用邀请码加入</text>
    <view class="empty-actions">
      <view class="ui-btn ui-btn--primary" @click="goCreateRoom">创建宿舍</view>
      <view class="ui-btn ui-btn--ghost" @click="goJoinRoom">我有邀请码</view>
    </view>
  </view>

  <view class="ui-bottom-bar" v-if="myRooms.length > 0">
    <view class="ui-btn ui-btn--ghost" @click="goJoinRoom">加入宿舍</view>
    <view class="ui-btn ui-btn--primary" @click="goCreateRoom">创建宿舍</view>
  </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRoom } from '@/composables/useRoom'
import { useRequireLogin } from '@/composables/useRequireLogin'
import PageLoading from '@/components/PageLoading.vue'
import type { Room } from '@/types/room'

const { requireLogin } = useRequireLogin()
const { currentRoom, myRooms, loadRooms, selectRoom } = useRoom()
const loading = ref(true)

const totalMembers = computed(() =>
  myRooms.value.reduce((sum, room) => sum + room.member_count, 0)
)

const avatarColors = [
  'linear-gradient(135deg, #2F7CF6, #5B9BFF)',
  'linear-gradient(135deg, #12B5A5, #4FD1A5)',
  'linear-gradient(135deg, #FF9F2E, #FFC83D)',
  'linear-gradient(135deg, #FF6B8B, #FF9AAE)',
  'linear-gradient(135deg, #22A6F2, #5CC2FF)',
  'linear-gradient(135deg, #FF7AB6, #FFA3CB)',
]

onShow(async () => {
  loading.value = true
  try {
    await loadRooms()
  } finally {
    loading.value = false
  }
})

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function getRoomTypeText(type: number) {
  const map: Record<number, string> = { 0: '学生宿舍', 1: '合租', 2: '员工宿舍' }
  return map[type] || '宿舍'
}

async function goRoomDetail(room: Room) {
  if (room.id !== currentRoom.value?.id) {
    await selectRoom(room.id)
  }
  uni.navigateTo({ url: '/pages/room/detail' })
}

function goCreateRoom() {
  requireLogin(() => uni.navigateTo({ url: '/pages/room/create' }))
}
function goJoinRoom() {
  requireLogin(() => uni.navigateTo({ url: '/pages/room/join' }))
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.room-list-page {
  min-height: 100vh;
  background: $bg-page;
}

.head-sub {
  font-size: $font-sm;
  color: $text-secondary;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-2 $space-5 0;
}

.room {
  padding: $space-4;
  background: $bg-card;
  border-radius: $radius-xl;
  border: 3rpx solid $border-light;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &.is-active {
    border-color: $primary;
    box-shadow: $shadow-primary;
  }

  &:active {
    transform: scale(0.98);
  }
}

.room-top {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.room-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &-text {
    font-size: $font-xl;
    font-weight: 900;
    color: $text-white;
  }
}

.room-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.room-name {
  font-size: $font-md;
  font-weight: 800;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.room-type {
  padding: 4rpx 14rpx;
  border-radius: $radius-full;
  background: $primary-bg;
  color: $primary;
  font-size: 22rpx;
  font-weight: 700;

  &--2 {
    background: $accent-lemon-soft;
    color: $accent-lemon-text;
  }
}

.room-count {
  font-size: $font-xs;
  color: $text-secondary;
}

.room-current {
  flex-shrink: 0;
  padding: 8rpx 20rpx;
  border-radius: $radius-full;
  background: $accent-lemon;
  color: $text-primary;
  font-size: $font-xs;
  font-weight: 800;
}

.room-arrow {
  font-size: $font-lg;
  color: $text-hint;
}

.room-notice {
  padding: $space-2 $space-3;
  background: $bg-page;
  border-radius: $radius-md;

  &-text {
    font-size: $font-xs;
    color: $text-secondary;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.empty-room {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: 0 $space-6;
}

.empty-icon {
  width: 180rpx;
  height: 180rpx;
  border-radius: 60rpx;
  background: $accent-lemon;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-6deg);
  margin-bottom: $space-3;
}

.empty-img {
  width: 88rpx;
  height: 88rpx;
}

.empty-title {
  font-size: $font-lg;
  font-weight: 900;
  color: $text-primary;
}

.empty-desc {
  font-size: $font-sm;
  color: $text-secondary;
  text-align: center;
}

.empty-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-top: $space-5;
}
</style>

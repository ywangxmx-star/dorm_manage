<template>
  <view class="room-list-page">
  <PageLoading v-if="loading" />
  <template v-else-if="myRooms.length > 0">
    <!-- 顶部统计 -->
    <view class="page-hero">
      <view class="page-hero-decor"></view>
      <view class="page-hero-inner">
        <view class="page-hero-stat">
          <text class="page-hero-num">{{ myRooms.length }}</text>
          <text class="page-hero-label">已加入宿舍</text>
        </view>
        <view class="page-hero-divider"></view>
        <view class="page-hero-stat">
          <text class="page-hero-num">{{ totalMembers }}</text>
          <text class="page-hero-label">总成员</text>
        </view>
      </view>
    </view>

    <!-- 宿舍列表 -->
    <view class="room-list">
      <view
        v-for="room in myRooms"
        :key="room.id"
        class="room-item"
        :class="{ 'is-active': room.id === currentRoom?.id }"
        @click="goRoomDetail(room)"
      >
        <view class="room-avatar" :style="{ background: getAvatarColor(room.room_name) }">
          <text class="room-avatar-text">{{ room.room_name.charAt(0) }}</text>
        </view>
        <view class="room-item-body">
          <view class="room-item-top">
            <text class="room-item-name">{{ room.room_name }}</text>
            <view v-if="room.id === currentRoom?.id" class="badge-current">当前</view>
          </view>
          <view class="room-item-meta">
            <text class="meta-type" :class="`meta-type--${room.room_type}`">{{ getRoomTypeText(room.room_type) }}</text>
            <text class="meta-dot">·</text>
            <text class="meta-count">{{ room.member_count }}/{{ room.max_member }} 人</text>
          </view>
          <text v-if="room.notice" class="room-item-notice">{{ room.notice }}</text>
        </view>
        <image class="room-item-arrow" src="/static/icons/chevron-right.png" mode="aspectFit" />
      </view>
    </view>
  </template>

  <!-- 空状态 -->
  <view class="empty-room" v-else>
    <view class="empty-icon">
      <image class="empty-img" src="/static/icons/home.png" mode="aspectFit" />
    </view>
    <text class="empty-title">还没有加入任何宿舍</text>
    <text class="empty-desc">创建新宿舍或通过邀请码加入</text>
    <view class="empty-actions">
      <view class="page-action-btn page-action-btn--primary" @click="goCreateRoom">创建宿舍</view>
      <view class="page-action-btn page-action-btn--outline" @click="goJoinRoom">加入宿舍</view>
    </view>
  </view>

  <!-- 底部操作 -->
  <view class="bottom-bar" v-if="myRooms.length > 0">
    <view class="page-action-btn page-action-btn--outline bottom-btn" @click="goJoinRoom">加入宿舍</view>
    <view class="page-action-btn page-action-btn--primary bottom-btn" @click="goCreateRoom">创建宿舍</view>
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
  'linear-gradient(135deg, #6366F1, #818CF8)',
  'linear-gradient(135deg, #14B8A6, #34D399)',
  'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #F43F5E, #FB7185)',
  'linear-gradient(135deg, #0EA5E9, #38BDF8)',
  'linear-gradient(135deg, #8B5CF6, #A78BFA)',
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
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

/* ---------- 顶部统计 ---------- */
.page-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #FDF8F0 0%, #FEF3C7 55%, #FFFBEB 100%);
  padding: $space-4 $space-4 $space-3;
  border-bottom: 1rpx solid rgba($warning, 0.12);
}

.page-hero-decor {
  position: absolute;
  top: -60rpx;
  right: -40rpx;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba($warning, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.page-hero-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.75);
  border-radius: $radius-lg;
  padding: $space-3 $space-4;
  border: 1rpx solid rgba($warning, 0.15);
  backdrop-filter: blur(8rpx);
}

.page-hero-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.page-hero-num {
  font-size: $font-md;
  font-weight: 800;
  color: $text-primary;
  line-height: 1.2;
}

.page-hero-label {
  font-size: 22rpx;
  color: $text-secondary;
  line-height: 1.2;
}

.page-hero-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba($warning, 0.2);
  flex-shrink: 0;
}

/* ---------- 宿舍列表 ---------- */
.room-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-3 $space-4 0;
}

.room-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  transition: $transition-fast;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  &.is-active {
    border-color: rgba($primary, 0.35);
    background: linear-gradient(135deg, rgba($primary, 0.04), rgba($primary-light, 0.02));
    box-shadow: 0 4rpx 16rpx rgba($primary, 0.08);
  }
}

.room-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.room-avatar-text {
  font-size: $font-base;
  font-weight: 700;
  color: $text-white;
}

.room-item-body {
  flex: 1;
  min-width: 0;
}

.room-item-top {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: 4rpx;
}

.room-item-name {
  font-size: $font-base;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-current {
  flex-shrink: 0;
  font-size: 20rpx;
  font-weight: 600;
  color: $primary;
  background: $primary-bg;
  padding: 2rpx $space-2;
  border-radius: $radius-full;
  line-height: 1.4;
}

.room-item-meta {
  display: flex;
  align-items: center;
  gap: $space-1;
}

.meta-type {
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1.3;

  &--0 { color: $primary; }
  &--1 { color: $accent-teal; }
  &--2 { color: $warning; }
}

.meta-dot {
  font-size: 22rpx;
  color: $text-hint;
}

.meta-count {
  font-size: 22rpx;
  color: $text-secondary;
}

.room-item-notice {
  display: block;
  font-size: 22rpx;
  color: $text-hint;
  margin-top: $space-1;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-item-arrow {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.25;
  flex-shrink: 0;
}

/* ---------- 空状态 ---------- */
.empty-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-10 $space-6 $space-6;
}

.empty-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, rgba($warning, 0.12), rgba($warning-light, 0.06));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $space-4;

  .empty-img {
    width: 48rpx;
    height: 48rpx;
    opacity: 0.7;
  }
}

.empty-title {
  font-size: $font-base;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $space-1;
}

.empty-desc {
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: $space-6;
}

.empty-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

/* ---------- 底部操作 ---------- */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: $space-3;
  padding: $space-3 $space-4;
  padding-bottom: calc($space-3 + env(safe-area-inset-bottom));
  background: linear-gradient(transparent, $bg-page 30%);
  z-index: 50;
}

.bottom-btn {
  flex: 1;
}
</style>

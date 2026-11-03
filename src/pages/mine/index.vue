<template>
  <view class="mine-page">
    <!-- ==================== 顶部头部 ==================== -->
    <view class="page-header">
      <view class="header-bg-decor"></view>
      <view class="header-bg-decor-2"></view>
      <view class="header-inner">
        <view class="header-content">
          <text class="header-date">{{ todayDate }}</text>
          <text class="header-title">我的</text>
        </view>
      </view>
    </view>

    <scroll-view class="page-scroll" scroll-y>
      <view class="page-scroll-inner">
      <!-- ==================== 个人资料卡片 ==================== -->
      <view class="profile-card" @click="goProfile">
        <view class="profile-avatar-wrap">
          <MemberAvatar :avatar="avatarUrl" :nickname="userInfo?.nickname || '未登录'" />
          <view class="profile-edit-badge">
            <text class="profile-edit-icon">✎</text>
          </view>
        </view>
        <view class="profile-info">
          <text class="profile-name">{{ userInfo?.nickname || '未登录' }}</text>
          <text class="profile-id">ID: {{ userInfo?.id || '-' }}</text>
        </view>
        <image class="profile-arrow" src="/static/icons/chevron-right.png" mode="aspectFill" />
      </view>

      <!-- ==================== 当前宿舍统计 ==================== -->
      <view v-if="currentRoom" class="stats-card card slide-up">
        <view class="stats-head" @click="openRoomPicker">
          <view class="stats-head-left">
            <view class="stats-room-avatar">
              <text class="stats-room-avatar-text">{{ currentRoom.room_name.charAt(0) }}</text>
            </view>
            <view class="stats-head-info">
              <text class="stats-room-name">{{ currentRoom.room_name }}</text>
              <text class="stats-room-meta">当前宿舍 · 我的待办统计</text>
            </view>
          </view>
          <view v-if="myRooms.length > 1" class="stats-switch">
            <text class="stats-switch-text">切换</text>
            <text class="stats-switch-arrow">›</text>
          </view>
        </view>
        <view class="stats-kpi">
          <view class="stats-item" @click="goTaskList">
            <text class="stats-num">{{ myPendingTaskCount }}</text>
            <text class="stats-lbl">我的待办</text>
          </view>
          <view class="stats-divider"></view>
          <view class="stats-item" @click="goBillList">
            <text class="stats-num">{{ myUnpaidBillCount }}</text>
            <text class="stats-lbl">我的待付</text>
          </view>
          <view class="stats-divider"></view>
          <view class="stats-item" @click="goVote">
            <text class="stats-num">{{ myPendingVoteCount }}</text>
            <text class="stats-lbl">待参与投票</text>
          </view>
        </view>
      </view>
      <view v-else class="stats-empty card slide-up" @click="goMyRooms">
        <text class="stats-empty-title">暂无当前宿舍</text>
        <text class="stats-empty-desc">加入或创建宿舍后，可查看待办、待付与投票</text>
      </view>

      <!-- ==================== 菜单列表 ==================== -->
      <view class="menu-group">
        <view class="menu-card">
          <view class="menu-item" @click="goMyRooms">
            <view class="menu-icon menu-icon--primary">
              <image class="menu-icon-img" src="/static/icons/home.png" mode="aspectFill" />
            </view>
            <text class="menu-text">我的宿舍</text>
            <image class="menu-arrow" src="/static/icons/chevron-right.png" mode="aspectFill" />
          </view>
          <view class="menu-divider"></view>
          <view class="menu-item" @click="goMyTasks">
            <view class="menu-icon menu-icon--primary">
              <image class="menu-icon-img" src="/static/icons/task.png" mode="aspectFill" />
            </view>
            <text class="menu-text">我的任务</text>
            <image class="menu-arrow" src="/static/icons/chevron-right.png" mode="aspectFill" />
          </view>
          <view class="menu-divider"></view>
          <view class="menu-item" @click="goMyBills">
            <view class="menu-icon menu-icon--primary">
              <image class="menu-icon-img" src="/static/icons/receipt.png" mode="aspectFill" />
            </view>
            <text class="menu-text">我的账单</text>
            <image class="menu-arrow" src="/static/icons/chevron-right.png" mode="aspectFill" />
          </view>
          <view class="menu-divider"></view>
          <view class="menu-item" @click="goVote">
            <view class="menu-icon menu-icon--primary">
              <image class="menu-icon-img" src="/static/icons/vote.png" mode="aspectFill" />
            </view>
            <text class="menu-text">投票</text>
            <image class="menu-arrow" src="/static/icons/chevron-right.png" mode="aspectFill" />
          </view>
          <view class="menu-divider"></view>
          <view class="menu-item" @click="goFeedback">
            <view class="menu-icon menu-icon--secondary">
              <image class="menu-icon-img" src="/static/icons/star.png" mode="aspectFill" />
            </view>
            <text class="menu-text">意见反馈</text>
            <image class="menu-arrow" src="/static/icons/chevron-right.png" mode="aspectFill" />
          </view>
        </view>
      </view>

      <view
        v-if="authStore.isLoggedIn"
        class="logout-btn page-action-btn page-action-btn--danger-outline"
        @click="handleLogout"
      >
        <text class="page-action-btn__text">退出登录</text>
      </view>
      <view v-else class="logout-btn page-action-btn" @click="goLogin">
        <text class="page-action-btn__text">去登录</text>
      </view>

      <text class="version-text">舍小圈 v1.0.4</text>

      <view class="bottom-safe"></view>
      </view>
    </scroll-view>

    <RoomPickerSheet
      v-model="showRoomPicker"
      :rooms="myRooms"
      :current-room-id="currentRoom?.id"
      @select="switchRoom"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { useRoom } from '@/composables/useRoom'
import { useMineRoomStats } from '@/composables/useMineRoomStats'
import { useRequireLogin } from '@/composables/useRequireLogin'
import { resolveImageUrl } from '@/api/request'
import MemberAvatar from '@/components/MemberAvatar.vue'
import RoomPickerSheet from '@/components/RoomPickerSheet.vue'
import type { Room } from '@/types/room'

const authStore = useAuthStore()
const { requireLogin } = useRequireLogin()
const { currentRoom, myRooms, loadRooms, selectRoom } = useRoom()
const showRoomPicker = ref(false)
const {
  myPendingTaskCount,
  myUnpaidBillCount,
  myPendingVoteCount,
  loadStats,
} = useMineRoomStats()
const userInfo = computed(() => authStore.userInfo)
const avatarUrl = computed(() => resolveImageUrl(userInfo.value?.avatar || ''))

onShow(async () => {
  if (!authStore.isLoggedIn) return
  await loadRooms()
  await loadStats()
})

const todayDate = computed(() => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekDay = weekDays[d.getDay()]
  return `${year}年${month}月${day}日 星期${weekDay}`
})

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

function goProfile() {
  requireLogin(() => uni.navigateTo({ url: '/pages/mine/profile' }))
}
function goMyRooms() { uni.navigateTo({ url: '/pages/room/list' }) }

function openRoomPicker() {
  if (myRooms.value.length <= 1) return
  showRoomPicker.value = true
}

async function switchRoom(room: Room) {
  if (room.id === currentRoom.value?.id) {
    showRoomPicker.value = false
    return
  }
  await selectRoom(room.id)
  showRoomPicker.value = false
  await loadStats()
}
function goMyTasks() { uni.switchTab({ url: '/pages/task/list' }) }
function goMyBills() { uni.switchTab({ url: '/pages/bill/list' }) }
function goTaskList() { uni.switchTab({ url: '/pages/task/list' }) }
function goBillList() { uni.switchTab({ url: '/pages/bill/list' }) }
function goVote() { uni.navigateTo({ url: '/pages/vote/list' }) }
function goFeedback() {
  requireLogin(() => uni.navigateTo({ url: '/pages/mine/feedback' }))
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录？',
    success: (res) => {
      if (res.confirm) {
        authStore.logout()
      }
    },
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.mine-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: $bg-page;
  box-sizing: border-box;
}

// ===== 顶部渐变头部 =====
.page-header {
  position: relative;
  z-index: 2;
  overflow: hidden;
  background: $hero-gradient;
  padding: calc(var(--status-bar-height) + 48rpx) $space-5 $space-6;
  flex-shrink: 0;
}

.header-bg-decor {
  position: absolute;
  top: -120rpx;
  right: -80rpx;
  width: 400rpx;
  height: 400rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 70%);
  pointer-events: none;
}

.header-bg-decor-2 {
  position: absolute;
  bottom: -60rpx;
  left: -40rpx;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.header-inner {
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.header-date {
  font-size: $font-sm;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.04em;
  line-height: 1.3;
}

.header-title {
  font-size: 52rpx;
  font-weight: 800;
  color: $text-white;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

// ===== 可滚动内容 =====
.page-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.page-scroll-inner {
  padding: $space-5 $space-4 0;
  box-sizing: border-box;
}

// ===== 个人卡片 =====
.profile-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5 $space-5;
  display: flex;
  align-items: center;
  gap: $space-4;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-color;
  margin-bottom: $space-4;
  transition: $transition-fast;
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

  &:active {
    opacity: 0.8;
  }
}

.profile-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.profile-edit-badge {
  position: absolute;
  bottom: 0;
  right: -2rpx;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: $primary-gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid $bg-card;
  box-shadow: 0 2rpx 8rpx rgba($primary, 0.25);
}

.profile-edit-icon {
  font-size: 16rpx;
  color: $text-white;
  font-weight: 700;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: $font-lg;
  font-weight: 700;
  color: $text-primary;
  display: block;
  line-height: 1.3;
}

.profile-id {
  font-size: 24rpx;
  color: $text-hint;
  margin-top: $space-1;
  display: block;
}

.profile-arrow {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.25;
  flex-shrink: 0;
}

// ===== 宿舍统计 =====
.stats-card {
  margin-bottom: $space-4;
  padding: $space-4 $space-4 $space-3;
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
}

.stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: 1rpx solid $border-light;
  transition: $transition-fast;

  &:active {
    opacity: 0.8;
  }
}

.stats-head-left {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
  min-width: 0;
}

.stats-room-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, rgba($primary, 0.15), rgba($primary-light, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1rpx solid rgba($primary, 0.12);
}

.stats-room-avatar-text {
  font-size: 32rpx;
  font-weight: 800;
  color: $primary;
}

.stats-head-info {
  flex: 1;
  min-width: 0;
}

.stats-room-name {
  display: block;
  font-size: $font-base;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.3;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.stats-room-meta {
  display: block;
  margin-top: 4rpx;
  font-size: $font-xs;
  color: $text-hint;
}

.stats-switch {
  display: flex;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
  padding: 10rpx 20rpx;
  border-radius: $radius-full;
  background: $primary-bg;
  border: 1rpx solid rgba($primary, 0.12);

  &:active {
    opacity: 0.8;
  }
}

.stats-switch-text {
  font-size: $font-xs;
  color: $primary;
  font-weight: 600;
}

.stats-switch-arrow {
  font-size: $font-xs;
  color: $primary;
  font-weight: 600;
}

.stats-kpi {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba($primary, 0.06), rgba($primary-light, 0.03));
  border-radius: $radius-lg;
  border: 1rpx solid rgba($primary, 0.08);
  padding: $space-3 0;
}

.stats-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: $space-2 0;
  transition: $transition-fast;

  &:active {
    opacity: 0.7;
  }
}

.stats-num {
  font-size: 44rpx;
  font-weight: 800;
  color: $primary;
  line-height: 1.1;
}

.stats-lbl {
  font-size: 22rpx;
  color: $text-secondary;
  font-weight: 500;
}

.stats-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba($primary, 0.12);
}

.stats-empty {
  margin-bottom: $space-4;
  padding: $space-6 $space-5;
  text-align: center;
  transition: $transition-fast;

  &:active {
    opacity: 0.85;
  }
}

.stats-empty-title {
  display: block;
  font-size: $font-base;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $space-2;
}

.stats-empty-desc {
  display: block;
  font-size: $font-xs;
  color: $text-hint;
  line-height: 1.6;
}

// ===== 菜单分组 =====
.menu-group {
  margin-bottom: $space-4;
}

.menu-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-2 0;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-color;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: $space-3 $space-4;
  transition: $transition-fast;
  position: relative;

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

  &:active {
    opacity: 0.6;
  }
}

.menu-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: $space-3;
  flex-shrink: 0;

  &-img {
    width: 28rpx;
    height: 28rpx;
  }

  &--primary {
    background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary-light, 0.05));
  }

  &--secondary {
    background: $bg-hover;
  }
}

.menu-text {
  flex: 1;
  font-size: $font-base;
  color: $text-primary;
  font-weight: 600;
}

.menu-arrow {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.25;
  flex-shrink: 0;
}

.menu-divider {
  height: 1rpx;
  background-color: $border-light;
  margin: 0 $space-4;
}

// ===== 退出登录 =====
.logout-btn {
  margin-bottom: $space-4;
}

// ===== 版本号 =====
.version-text {
  display: block;
  text-align: center;
  font-size: $font-xs;
  color: $text-hint;
}

.bottom-safe {
  height: calc(env(safe-area-inset-bottom) + 16rpx);
}
</style>

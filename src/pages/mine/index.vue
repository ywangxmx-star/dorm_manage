<template>
  <view class="mine-page">
    <scroll-view class="page-scroll" scroll-y>
      <view class="page-scroll-inner">
        <view class="hero">
          <text class="hero-title">我的</text>
          <view class="profile">
            <view class="profile-main" @click="goProfile">
              <MemberAvatar :avatar="avatarUrl" :nickname="userInfo?.nickname || '未登录'" />
              <view class="profile-info">
                <text class="profile-name">{{ userInfo?.nickname || '未登录' }}</text>
                <text class="profile-id">ID {{ userInfo?.id || '------' }}</text>
              </view>
              <view class="profile-edit">
                <text>编辑资料</text>
                <image class="chevron" src="/static/icons/chevron-right.png" mode="aspectFit" />
              </view>
            </view>
            <view class="profile-room" @click="currentRoom ? openRoomPicker() : goMyRooms()">
              <image class="profile-room-icon" src="/static/icons/home.png" mode="aspectFit" />
              <text class="profile-room-name">{{ currentRoom ? currentRoom.room_name : '还没有加入宿舍' }}</text>
              <text class="profile-room-action">{{ currentRoom ? (myRooms.length > 1 ? '切换' : '查看') : '去加入' }}</text>
            </view>
          </view>
        </view>

        <view v-if="currentRoom" class="kpi slide-up">
          <view class="kpi-item" @click="goTaskList">
            <text class="kpi-num" :class="{ 'is-zero': !myPendingTaskCount }">{{ myPendingTaskCount }}</text>
            <text class="kpi-lbl">我的待办</text>
          </view>
          <view class="kpi-divider"></view>
          <view class="kpi-item" @click="goBillList">
            <text class="kpi-num" :class="{ 'is-zero': !myUnpaidBillCount }">{{ myUnpaidBillCount }}</text>
            <text class="kpi-lbl">我的待付</text>
          </view>
          <view class="kpi-divider"></view>
          <view class="kpi-item" @click="goVote">
            <text class="kpi-num" :class="{ 'is-zero': !myPendingVoteCount }">{{ myPendingVoteCount }}</text>
            <text class="kpi-lbl">待投票</text>
          </view>
        </view>

        <text class="section-label">常用功能</text>
        <view class="grid">
          <view class="grid-item" @click="goMyRooms">
            <view class="grid-icon"><image class="grid-icon-img" src="/static/icons/home.png" mode="aspectFit" /></view>
            <text class="grid-text">我的宿舍</text>
          </view>
          <view class="grid-item" @click="goMyTasks">
            <view class="grid-icon"><image class="grid-icon-img" src="/static/icons/task.png" mode="aspectFit" /></view>
            <text class="grid-text">我的任务</text>
          </view>
          <view class="grid-item" @click="goMyBills">
            <view class="grid-icon"><image class="grid-icon-img" src="/static/icons/receipt.png" mode="aspectFit" /></view>
            <text class="grid-text">我的账单</text>
          </view>
          <view class="grid-item" @click="goVote">
            <view class="grid-icon"><image class="grid-icon-img" src="/static/icons/vote.png" mode="aspectFit" /></view>
            <text class="grid-text">投票</text>
          </view>
        </view>

        <text class="section-label">更多</text>
        <view class="list">
          <view class="list-item" @click="goNotifications">
            <image class="list-icon" src="/static/icons/bell.png" mode="aspectFit" />
            <text class="list-text">消息通知</text>
            <image class="chevron" src="/static/icons/chevron-right.png" mode="aspectFit" />
          </view>
          <view class="list-item" @click="goFeedback">
            <image class="list-icon" src="/static/icons/star.png" mode="aspectFit" />
            <text class="list-text">意见反馈</text>
            <image class="chevron" src="/static/icons/chevron-right.png" mode="aspectFit" />
          </view>
        </view>

        <view class="foot">
          <view v-if="authStore.isLoggedIn" class="ui-btn ui-btn--ghost foot-btn foot-btn--out" @click="handleLogout">退出登录</view>
          <view v-else class="ui-btn ui-btn--primary foot-btn" @click="goLogin">去登录</view>
          <text class="version-text">舍小圈 v1.0.4</text>
        </view>

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
function goNotifications() {
  requireLogin(() => uni.navigateTo({ url: '/pages/notification/list' }))
}
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-page;
}

.page-scroll {
  flex: 1;
  height: 0;
}

.page-scroll-inner {
  padding-top: calc(var(--status-bar-height) + 32rpx);
}

.hero {
  padding: 0 $page-gutter;
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &-title {
    font-size: $font-lg;
    font-weight: 700;
    color: $text-primary;
  }
}

.profile {
  background: $bg-card;
  border-radius: $radius-xl;
  border: 1rpx solid $border-light;
  box-shadow: $shadow-md;
  overflow: hidden;

  &-main {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-5 $space-4;

    &:active {
      background: $bg-subtle;
    }
  }

  &-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &-name {
    font-size: $font-md;
    font-weight: 600;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-id {
    font-size: $font-xs;
    color: $text-hint;
    font-variant-numeric: tabular-nums;
  }

  &-edit {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4rpx;
    font-size: $font-xs;
    color: $text-secondary;
  }

  &-room {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx $space-4;
    background: $bg-subtle;
    border-top: 1rpx solid $border-light;

    &:active {
      background: $bg-hover;
    }

    &-icon {
      width: 32rpx;
      height: 32rpx;
      opacity: 0.6;
    }

    &-name {
      flex: 1;
      min-width: 0;
      font-size: $font-sm;
      font-weight: 500;
      color: $text-primary;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-action {
      flex-shrink: 0;
      font-size: $font-xs;
      font-weight: 600;
      color: $primary;
    }
  }
}

.chevron {
  width: 26rpx;
  height: 26rpx;
  opacity: 0.4;
  flex-shrink: 0;
}

.kpi {
  display: flex;
  align-items: center;
  margin: $space-3 $page-gutter 0;
  padding: $space-4 0;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1rpx solid $border-light;
}

.kpi-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;

  &:active {
    opacity: 0.6;
  }
}

.kpi-divider {
  width: 1rpx;
  height: 64rpx;
  background: $border-light;
}

.kpi-num {
  font-family: $font-num;
  font-size: $font-xl;
  font-weight: 700;
  color: $primary;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;

  &.is-zero {
    color: $text-primary;
  }
}

.kpi-lbl {
  font-size: $font-xs;
  color: $text-secondary;
}

.section-label {
  display: block;
  padding: $space-6 $page-gutter $space-2;
  font-size: $font-xs;
  font-weight: 500;
  color: $text-hint;
}

.grid {
  display: flex;
  margin: 0 $page-gutter;
  padding: $space-4 0;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1rpx solid $border-light;
}

.grid-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;

  &:active {
    opacity: 0.6;
  }
}

.grid-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius-md;
  background: $primary-bg;
  display: flex;
  align-items: center;
  justify-content: center;

  &-img {
    width: 40rpx;
    height: 40rpx;
  }
}

.grid-text {
  font-size: $font-xs;
  font-weight: 500;
  color: $text-primary;
}

.list {
  margin: 0 $page-gutter;
  padding: 0 $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1rpx solid $border-light;
}

.list-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  height: 104rpx;
  border-bottom: 1rpx solid $border-light;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    opacity: 0.6;
  }
}

.list-icon {
  width: 36rpx;
  height: 36rpx;
  opacity: 0.7;
}

.list-text {
  flex: 1;
  font-size: $font-sm;
  color: $text-primary;
}

.foot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  padding: $space-8 $page-gutter 0;
}

.foot-btn {
  width: 100%;

  &--out {
    color: $danger;
  }
}

.version-text {
  font-size: 22rpx;
  color: $text-hint;
}

.bottom-safe {
  height: calc(env(safe-area-inset-bottom) + 160rpx);
}
</style>

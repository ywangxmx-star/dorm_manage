<template>
  <view class="mine-page">
    <scroll-view class="page-scroll" scroll-y>
      <view class="page-scroll-inner">
        <view class="hero">
          <text class="hero-date">{{ todayDate }}</text>
          <view class="id-card" @click="goProfile">
            <view class="id-card-top">
              <text class="id-card-brand">舍小圈 · 住户卡</text>
              <text class="id-card-edit">编辑资料 ›</text>
            </view>
            <view class="id-card-main">
              <view class="id-avatar">
                <MemberAvatar :avatar="avatarUrl" :nickname="userInfo?.nickname || '未登录'" />
              </view>
              <view class="id-info">
                <text class="id-name">{{ userInfo?.nickname || '未登录' }}</text>
                <text class="id-no">NO.{{ userInfo?.id || '------' }}</text>
              </view>
            </view>
            <view class="id-card-foot" @click.stop="currentRoom ? openRoomPicker() : goMyRooms()">
              <view class="id-room">
                <text class="id-room-lbl">当前宿舍</text>
                <text class="id-room-name">{{ currentRoom ? currentRoom.room_name : '还没有加入宿舍' }}</text>
              </view>
              <view class="id-switch">
                <text>{{ currentRoom ? (myRooms.length > 1 ? '切换' : '查看') : '去加入' }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="currentRoom" class="kpi slide-up">
          <view class="kpi-item kpi-item--blue" @click="goTaskList">
            <text class="kpi-num">{{ myPendingTaskCount }}</text>
            <text class="kpi-lbl">我的待办</text>
          </view>
          <view class="kpi-item kpi-item--lemon" @click="goBillList">
            <text class="kpi-num">{{ myUnpaidBillCount }}</text>
            <text class="kpi-lbl">我的待付</text>
          </view>
          <view class="kpi-item kpi-item--mint" @click="goVote">
            <text class="kpi-num">{{ myPendingVoteCount }}</text>
            <text class="kpi-lbl">待投票</text>
          </view>
        </view>

        <text class="ui-form-label">常用</text>
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

        <view class="ui-form-group list">
          <view class="list-item" @click="goFeedback">
            <image class="list-icon" src="/static/icons/star.png" mode="aspectFit" />
            <text class="list-text">意见反馈</text>
            <text class="list-arrow">›</text>
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
  padding-top: calc(env(safe-area-inset-top) + 40rpx);
}

.hero {
  padding: 0 $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &-date {
    font-size: $font-xs;
    font-weight: 700;
    color: $primary;
    letter-spacing: 0.06em;
  }
}

/* 住户卡 */
.id-card {
  background: $primary;
  border-radius: $radius-xl;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  box-shadow: $shadow-primary;

  &-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &-brand {
    font-size: 22rpx;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.75);
    letter-spacing: 0.08em;
  }

  &-edit {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.85);
  }

  &-main {
    display: flex;
    align-items: center;
    gap: $space-4;
  }

  &-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-3 $space-4;
    background: $bg-card;
    border-radius: $radius-lg;
  }
}

.id-avatar {
  padding: 6rpx;
  border-radius: 50%;
  background: $accent-lemon;
}

.id-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.id-name {
  font-size: 44rpx;
  font-weight: 900;
  color: $text-white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.id-no {
  font-size: $font-xs;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.1em;
}

.id-room {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  min-width: 0;

  &-lbl {
    font-size: 22rpx;
    color: $text-hint;
  }

  &-name {
    font-size: $font-sm;
    font-weight: 800;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.id-switch {
  flex-shrink: 0;
  padding: 10rpx 24rpx;
  border-radius: $radius-full;
  background: $accent-lemon;
  font-size: $font-xs;
  font-weight: 800;
  color: $text-primary;
}

/* KPI */
.kpi {
  display: flex;
  gap: $space-3;
  padding: $space-4 $space-5 0;
}

.kpi-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding: $space-4 $space-3;
  border-radius: $radius-lg;

  &--blue { background: $primary-bg; }
  &--lemon { background: $accent-lemon-soft; }
  &--mint { background: $success-bg; }

  &:active {
    transform: scale(0.97);
  }
}

.kpi-num {
  font-size: 56rpx;
  font-weight: 900;
  color: $text-primary;
  line-height: 1.1;
}

.kpi-lbl {
  font-size: $font-xs;
  font-weight: 600;
  color: $text-secondary;
}

/* 宫格 */
.grid {
  display: flex;
  gap: $space-3;
  padding: 0 $space-5 $space-4;
}

.grid-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: $space-4 0;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;

  &:active {
    transform: scale(0.96);
  }
}

.grid-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 28rpx;
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
  font-weight: 700;
  color: $text-primary;
}

.list-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  height: 104rpx;
}

.list-icon {
  width: 40rpx;
  height: 40rpx;
}

.list-text {
  flex: 1;
  font-size: $font-sm;
  font-weight: 700;
  color: $text-primary;
}

.list-arrow {
  font-size: $font-md;
  color: $text-hint;
}

.foot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-5 0;
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

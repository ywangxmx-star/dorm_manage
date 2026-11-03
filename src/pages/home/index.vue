<template>
  <view class="home-page">
    <!-- ==================== 加载中 ==================== -->
    <view v-if="loading" class="loading-page">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
    </view>

    <!-- ==================== 有宿舍 - 内容区 ==================== -->
    <template v-else-if="currentRoom">
      <view class="home-body">
        <view class="page-header">
          <view class="header-bg-decor"></view>
          <view class="header-inner">
            <view class="header-room" @click="showRoomPicker = true">
              <view class="header-room-left">
                <view class="header-room-avatar">
                  <text class="header-room-avatar-text">{{ currentRoom.room_name.charAt(0) }}</text>
                </view>
                <view class="header-room-info">
                  <text class="header-room-name">{{ currentRoom.room_name }}</text>
                  <text class="header-room-meta">{{ myRooms.length > 1 ? myRooms.length + '个宿舍' : '我的宿舍' }}</text>
                </view>
              </view>
              <view v-if="myRooms.length > 1" class="header-room-switch">
                <text class="switch-text">切换</text>
                <text class="switch-arrow">›</text>
              </view>
            </view>

            <view class="header-kpi">
              <view class="kpi-item" @click="goMembers">
                <text class="kpi-num">{{ currentRoom.member_count }}</text>
                <text class="kpi-lbl">成员</text>
              </view>
              <view class="kpi-divider"></view>
              <view class="kpi-item" @click="goTaskList">
                <text class="kpi-num">{{ todayTasks.length }}</text>
                <text class="kpi-lbl">待办</text>
              </view>
              <view class="kpi-divider"></view>
              <view class="kpi-item" @click="goBillList">
                <text class="kpi-num">{{ unpaidBills.length }}</text>
                <text class="kpi-lbl">待付</text>
              </view>
              <view class="kpi-divider"></view>
              <view class="kpi-item" @click="goVoteList">
                <text class="kpi-num">{{ activeVotes.length }}</text>
                <text class="kpi-lbl">投票</text>
              </view>
            </view>
          </view>
        </view>

        <scroll-view
          class="page-content"
          scroll-y
          :refresher-enabled="refresherEnabled"
          :refresher-threshold="REFRESHER_THRESHOLD"
          refresher-default-style="black"
          refresher-background="#F3F7FD"
          :upper-threshold="30"
          :refresher-triggered="refreshing"
          @scroll="onContentScroll"
          @scrolltoupper="onScrollToUpper"
          @refresherrestore="onRefresherRestore"
          @refresherrefresh="onRefresh"
        >
          <view v-if="currentRoom.notice" class="content-notice">
            <text class="content-notice-dot"></text>
            <text class="content-notice-text">{{ currentRoom.notice }}</text>
          </view>

          <view class="section" :class="{ 'section--first': !currentRoom.notice }">
          <view class="section-hd">
            <text class="section-hd-title">快捷操作</text>
          </view>
          <view class="actions-row">
            <view v-if="isLeader" class="action-item" @click="goCreateTask">
              <view class="action-icon action-icon--task">
                <image class="action-icon-img" src="/static/icons/task.png" mode="aspectFit" />
              </view>
              <text class="action-label">发布任务</text>
            </view>
            <view class="action-item" @click="goCreateBill">
              <view class="action-icon action-icon--bill">
                <image class="action-icon-img" src="/static/icons/wallet.png" mode="aspectFit" />
              </view>
              <text class="action-label">记一笔账</text>
            </view>
            <view class="action-item" @click="goBillList">
              <view class="action-icon action-icon--receipt">
                <image class="action-icon-img" src="/static/icons/receipt.png" mode="aspectFit" />
              </view>
              <text class="action-label">账单列表</text>
            </view>
            <view class="action-item" @click="goMembers">
              <view class="action-icon action-icon--member">
                <image class="action-icon-img" src="/static/icons/users.png" mode="aspectFit" />
              </view>
              <text class="action-label">成员管理</text>
            </view>
          </view>
        </view>

        <!-- ==================== 今日待办 ==================== -->
        <view class="section">
          <view class="section-hd">
            <view class="section-hd-left">
              <text class="section-hd-title">今日待办</text>
              <text v-if="todayTasks.length" class="section-hd-badge">{{ todayTasks.length }}</text>
            </view>
            <text class="section-hd-more" @click="goTaskList">查看全部</text>
          </view>
          <view class="data-card" v-if="todayTasks.length">
            <view class="data-card-body">
              <TaskCard
                v-for="task in visibleTasks"
                :key="task.id"
                :task="task"
                @click="goTaskDetail(task.id)"
              />
            </view>
            <view v-if="todayTasks.length > maxVisibleItems" class="data-card-expand" @click="toggleTasks">
              <text class="data-card-expand-text">{{ showAllTasks ? '收起' : '展开全部' }}</text>
              <image
                class="data-card-expand-icon"
                :class="{ 'is-open': showAllTasks }"
                src="/static/icons/chevron-right.png"
                mode="aspectFit"
              />
            </view>
          </view>
          <EmptyState v-else icon="/static/icons/task.png" title="一切顺利" text="暂无待办任务" />
        </view>

        <!-- ==================== 待付账单 ==================== -->
        <view class="section section--last">
          <view class="section-hd">
            <view class="section-hd-left">
              <text class="section-hd-title">待付账单</text>
              <text v-if="unpaidBills.length" class="section-hd-badge">{{ unpaidBills.length }}</text>
            </view>
            <text class="section-hd-more" @click="goBillList">查看全部</text>
          </view>
          <view class="data-card" v-if="unpaidBills.length">
            <view class="data-card-body">
              <BillCard
                v-for="bill in visibleBills"
                :key="bill.id"
                :bill="bill"
                @click="goBillDetail(bill.id)"
              />
            </view>
            <view v-if="unpaidBills.length > maxVisibleItems" class="data-card-expand" @click="toggleBills">
              <text class="data-card-expand-text">{{ showAllBills ? '收起' : '展开全部' }}</text>
              <image
                class="data-card-expand-icon"
                :class="{ 'is-open': showAllBills }"
                src="/static/icons/chevron-right.png"
                mode="aspectFit"
              />
            </view>
          </view>
          <EmptyState v-else icon="/static/icons/wallet.png" title="账单已清" text="暂无待付账单" />
        </view>

        <view class="safe-bottom"></view>
        </scroll-view>
      </view>
    </template>

    <!-- ==================== 无宿舍 - 空状态 ==================== -->
    <template v-else>
      <view class="empty-state">
        <view class="empty-card">
          <view class="empty-icon-wrap">
            <image class="empty-icon-img" src="/static/icons/app.png" mode="aspectFill" />
          </view>
          <text class="empty-title">欢迎来到舍小圈</text>
          <text class="empty-desc">创建或加入一个宿舍，开始管理宿舍生活</text>
          <view class="empty-actions">
            <view class="empty-btn empty-btn--outline" @click="goJoinRoom">加入宿舍</view>
            <view class="empty-btn empty-btn--primary" @click="goCreateRoom">创建宿舍</view>
          </view>
        </view>
      </view>
    </template>

    <!-- ==================== 宿舍选择弹窗 ==================== -->
    <view class="modal-mask" v-if="showRoomPicker" @click="showRoomPicker = false">
      <view class="modal" @click.stop>
        <view class="modal-handle"></view>
        <view class="modal-head">
          <text class="modal-head-title">切换宿舍</text>
          <view class="modal-head-close" @click="showRoomPicker = false">
            <image class="modal-head-close-icon" src="/static/icons/x.png" mode="aspectFit" />
          </view>
        </view>
        <scroll-view scroll-y class="modal-list">
          <view class="modal-list-inner">
          <view
            v-for="room in myRooms"
            :key="room.id"
            class="modal-item"
            :class="{ 'is-active': room.id === currentRoom?.id }"
            @click="switchRoom(room)"
          >
            <view class="modal-item-avatar">
              <text class="modal-item-avatar-text">{{ room.room_name.charAt(0) }}</text>
            </view>
            <view class="modal-item-info">
              <text class="modal-item-name">{{ room.room_name }}</text>
              <text class="modal-item-meta">{{ room.member_count }} 位成员</text>
            </view>
            <view v-if="room.id === currentRoom?.id" class="modal-item-check">
              <text class="modal-item-check-icon">✓</text>
            </view>
          </view>
          </view>
        </scroll-view>
        <view class="modal-actions">
          <view class="modal-btn" @click="showRoomPicker = false; goCreateRoom()">创建宿舍</view>
          <view class="modal-btn modal-btn--primary" @click="showRoomPicker = false; goJoinRoom()">加入宿舍</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { onLoad, onShow, onReady, onTabItemTap } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { useRoom } from '@/composables/useRoom'
import { useRequireLogin } from '@/composables/useRequireLogin'
import { getTaskList } from '@/api/task'
import { getBillList } from '@/api/bill'
import { getVoteList } from '@/api/vote'
import TaskCard from '@/components/TaskCard.vue'
import BillCard from '@/components/BillCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Task } from '@/types/task'
import type { Bill } from '@/types/bill'
import type { Vote } from '@/types/vote'
import type { Room } from '@/types/room'

const authStore = useAuthStore()
authStore.checkLogin()

const { requireLogin } = useRequireLogin()
const { currentRoom, myRooms, loadRooms, selectRoom } = useRoom()
const isLeader = computed(() => currentRoom.value?.owner_id === authStore.userInfo?.id)

const REFRESHER_THRESHOLD = 80
const REFRESHER_SCROLL_LOCK = 10
const LOAD_TIMEOUT_MS = 10000

const loading = ref(false)
const showRoomPicker = ref(false)
const refresherEnabled = ref(true)
const refreshing = ref(false)
const todayTasks = ref<Task[]>([])
const unpaidBills = ref<Bill[]>([])
const activeVotes = ref<Vote[]>([])
const showAllTasks = ref(false)
const showAllBills = ref(false)
const maxVisibleItems = 2
let pageLoadSeq = 0

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

const visibleTasks = computed(() =>
  showAllTasks.value ? todayTasks.value : todayTasks.value.slice(0, maxVisibleItems)
)

const visibleBills = computed(() =>
  showAllBills.value ? unpaidBills.value : unpaidBills.value.slice(0, maxVisibleItems)
)

function toggleTasks() {
  showAllTasks.value = !showAllTasks.value
}

function toggleBills() {
  showAllBills.value = !showAllBills.value
}

async function bootstrapHome() {
  const seq = ++pageLoadSeq
  authStore.checkLogin()
  if (!authStore.isLoggedIn) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    await withTimeout(
      (async () => {
        await loadRooms()
        if (seq !== pageLoadSeq) return
        if (currentRoom.value) {
          await Promise.all([loadTodayTasks(), loadUnpaidBills(), loadActiveVotes()])
        }
      })(),
      LOAD_TIMEOUT_MS,
    )
  } catch {
    // ignore
  } finally {
    if (seq === pageLoadSeq) {
      loading.value = false
    }
  }
}

function enterHome() {
  refresherEnabled.value = true
  bootstrapHome()
}

onLoad(() => {
  enterHome()
})

onShow(() => {
  enterHome()
})

onReady(() => {
  authStore.checkLogin()
  if (!authStore.isLoggedIn) {
    loading.value = false
    return
  }
  enterHome()
})

onTabItemTap(() => {
  enterHome()
})

function onContentScroll(e: { detail: { scrollTop: number } }) {
  if (e.detail.scrollTop > REFRESHER_SCROLL_LOCK) {
    refresherEnabled.value = false
  }
}

function onScrollToUpper() {
  refresherEnabled.value = true
}

function onRefresherRestore() {
  refresherEnabled.value = true
}

async function onRefresh() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await loadRooms()
    if (currentRoom.value) {
      await Promise.all([loadTodayTasks(), loadUnpaidBills(), loadActiveVotes()])
    }
  } finally {
    refreshing.value = false
    refresherEnabled.value = true
  }
}

watch(currentRoom, async (room) => {
  try {
    if (room) {
      await Promise.all([loadTodayTasks(), loadUnpaidBills(), loadActiveVotes()])
    } else {
      todayTasks.value = []
      unpaidBills.value = []
      activeVotes.value = []
    }
  } catch {
    // ignore
  }
})

async function switchRoom(room: Room) {
  if (room.id === currentRoom.value?.id) {
    showRoomPicker.value = false
    return
  }
  await selectRoom(room.id)
  showRoomPicker.value = false
}

async function loadTodayTasks() {
  if (!currentRoom.value) return
  try {
    const res = await getTaskList({
      room_id: currentRoom.value.id,
      page: 1,
      page_size: 50,
    })
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    todayTasks.value = res.data.items.filter(t => {
      if (t.status === 5 || t.status === 2 || t.status === 8) return false
      return new Date(t.deadline) <= now
    }).slice(0, 5)
  } catch {
    // ignore
  }
}

async function loadUnpaidBills() {
  if (!currentRoom.value) return
  try {
    const res = await getBillList({ room_id: currentRoom.value.id, page: 1, page_size: 5 })
    unpaidBills.value = res.data.items.filter(b => !b.is_settled)
  } catch {
    // ignore
  }
}

async function loadActiveVotes() {
  if (!currentRoom.value) return
  try {
    const res = await getVoteList({ room_id: currentRoom.value.id, page: 1, page_size: 5 })
    activeVotes.value = res.data.items.filter(v => v.status === 0)
  } catch {
    // ignore
  }
}

function goCreateRoom() {
  requireLogin(() => uni.navigateTo({ url: '/pages/room/create' }))
}
function goJoinRoom() {
  requireLogin(() => uni.navigateTo({ url: '/pages/room/join' }))
}
function goCreateTask() {
  requireLogin(() => uni.navigateTo({ url: '/pages/task/create' }))
}
function goCreateBill() {
  requireLogin(() => uni.navigateTo({ url: '/pages/bill/create' }))
}
function goBillList() { uni.switchTab({ url: '/pages/bill/list' }) }
function goMembers() { uni.navigateTo({ url: '/pages/room/members' }) }
function goRoomManage(roomId: number) {
  showRoomPicker.value = false
  uni.navigateTo({ url: `/pages/room/detail?id=${roomId}` })
}
function goTaskList() { uni.switchTab({ url: '/pages/task/list' }) }
function goVoteList() { uni.navigateTo({ url: '/pages/vote/list' }) }
function goTaskDetail(id: number) { uni.navigateTo({ url: `/pages/task/detail?id=${id}` }) }
function goBillDetail(id: number) { uni.navigateTo({ url: `/pages/bill/detail?id=${id}` }) }
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

/* ============================================================
   全局布局
   ============================================================ */
.home-page {
  min-height: 100vh;
  background-color: $bg-page;
}

.home-body {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
}

/* ============================================================
   加载中
   ============================================================ */
.loading-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-page;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid $border-color;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: $font-sm;
  color: $text-hint;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-content {
  flex: 1;
  height: 0;
  min-height: 0;
  box-sizing: border-box;
}

.safe-bottom {
  height: calc(env(safe-area-inset-bottom) + 16rpx);
}

/* ============================================================
   页面头部
   ============================================================ */
.page-header {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  background: $hero-gradient;
  padding: calc(var(--status-bar-height) + 48rpx) $space-5 $space-5;

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

  .header-inner {
    position: relative;
    z-index: 1;
  }
}

/* -- 宿舍信息 -- */
.header-room {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-5;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24rpx);
  border-radius: $radius-xl;
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  transition: $transition-fast;

  &:active {
    background: rgba(255, 255, 255, 0.18);
    transform: scale(0.98);
  }
}

.header-room-left {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
  min-width: 0;
}

.header-room-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: $radius-lg;
  background: $accent-lemon;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 4rpx solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 6rpx 18rpx rgba(30, 99, 214, 0.25);
  transform: rotate(-6deg);

  &-text {
    font-size: 38rpx;
    font-weight: 800;
    color: $text-primary;
    letter-spacing: -0.02em;
  }
}

.header-room-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.header-room-name {
  font-size: $font-md;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.header-room-meta {
  font-size: $font-xs;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
}

.header-room-switch {
  display: flex;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
  padding: 12rpx 24rpx;
  background: $accent-lemon;
  border-radius: $radius-full;

  &:active {
    opacity: 0.85;
  }

  .switch-text {
    font-size: $font-xs;
    color: $text-primary;
    font-weight: 700;
  }

  .switch-arrow {
    font-size: $font-xs;
    color: $text-primary;
    font-weight: 600;
  }
}

/* -- KPI -- */
.header-kpi {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12rpx);
  border-radius: $radius-xl;
  padding: $space-3 0;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.kpi-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: $space-2 0;
  transition: $transition-fast;

  &:active {
    opacity: 0.6;
  }
}

.kpi-num {
  font-size: 44rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
}

.kpi-lbl {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.kpi-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

/* -- 公告（滚动区） -- */
.content-notice {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: $space-4 $space-4 0;
  padding: $space-3 $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1rpx solid $border-color;
  box-shadow: $shadow-sm;

  &-dot {
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    background: $warning;
    flex-shrink: 0;
  }

  &-text {
    font-size: 24rpx;
    color: $text-secondary;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* ============================================================
   区块通用样式
   ============================================================ */
.section {
  padding: 0 $space-4;
  margin-top: $space-5;

  &--first {
    margin-top: $space-4;
  }

  &--last {
    margin-bottom: $space-4;
  }
}

.section-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;

  &-left {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &-title {
    font-size: $font-md;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: -0.01em;
  }

  &-badge {
    font-size: 20rpx;
    font-weight: 600;
    color: $danger;
    background: $danger-bg;
    min-width: 32rpx;
    height: 32rpx;
    line-height: 32rpx;
    text-align: center;
    border-radius: $radius-full;
    padding: 0 $space-2;
  }

  &-more {
    font-size: 24rpx;
    color: $text-hint;
    font-weight: 500;
    padding: $space-1 $space-3;
    border-radius: $radius-full;
    background: $bg-hover;
    transition: $transition-fast;

    &:active {
      background: $border-light;
      color: $primary;
    }
  }
}

/* ============================================================
   快捷操作
   ============================================================ */
.actions-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-3;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  padding: $space-4 $space-2;
  background: $bg-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  transition: $transition-base;
  border: 1rpx solid $border-color;

  &:active {
    transform: scale(0.95);
    box-shadow: $shadow-sm;
  }
}

.action-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: currentColor;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  &-img {
    width: 40rpx;
    height: 40rpx;
  }

  &--task {
    background: linear-gradient(135deg, rgba($primary, 0.12), rgba($primary-light, 0.06));
    color: $primary;
  }
  &--bill {
    background: linear-gradient(135deg, rgba($success, 0.12), rgba($success-light, 0.06));
    color: $success;
  }
  &--receipt {
    background: linear-gradient(135deg, rgba($warning, 0.12), rgba($warning-light, 0.06));
    color: $warning;
  }
  &--member {
    background: linear-gradient(135deg, rgba($accent-violet, 0.12), rgba($accent-violet, 0.06));
    color: $accent-violet;
  }
}

.action-label {
  font-size: 24rpx;
  font-weight: 600;
  color: $text-secondary;
}

/* ============================================================
   数据卡片（待办 / 待付）
   ============================================================ */
.data-card {
  background: transparent;
  border-radius: $radius-xl;
  padding: 0;

  &-body {
    display: flex;
    flex-direction: column;
  }

  &-expand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-1;
    padding: $space-3 0;
    transition: $transition-fast;

    &:active {
      opacity: 0.5;
    }

    &-text {
      font-size: 24rpx;
      color: $text-hint;
      font-weight: 500;
    }

    &-icon {
      width: 24rpx;
      height: 24rpx;
      opacity: 0.3;
      transition: transform 0.25s ease;

      &.is-open {
        transform: rotate(90deg);
      }
    }
  }
}

/* ============================================================
   空状态（无宿舍）
   ============================================================ */
.empty-state {
  padding: $space-16 $space-5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.empty-card {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: $space-12 $space-6;
  text-align: center;
  box-shadow: $shadow-md;
  border: 1rpx solid $border-color;
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

.empty-icon-wrap {
  width: 200rpx;
  height: 200rpx;
  margin: 0 auto $space-6;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
}

.empty-icon-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.empty-title {
  font-size: $font-lg;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: $space-3;
}

.empty-desc {
  font-size: $font-sm;
  color: $text-secondary;
  display: block;
  margin-bottom: $space-8;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: $space-3;
}

.empty-btn {
  flex: 1;
  height: 88rpx;
  border-radius: $radius-lg;
  font-size: $font-base;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-fast;

  &:active {
    transform: scale(0.97);
  }

  &--primary {
    background: $primary-gradient;
    color: $text-white;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba($primary, 0.3);
  }

  &--outline {
    background: transparent;
    color: $primary;
    border: 2rpx solid rgba($primary, 0.3);
  }
}

/* ============================================================
   宿舍选择弹窗（底部 Sheet）
   ============================================================ */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  backdrop-filter: blur(4rpx);
}

.modal {
  width: 100%;
  background: $bg-card;
  border-radius: $radius-xl $radius-xl 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &-handle {
    width: 48rpx;
    height: 6rpx;
    border-radius: 3rpx;
    background: $border-color;
    margin: $space-3 auto 0;
    flex-shrink: 0;
  }

  &-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-4 $space-5 $space-3;
    flex-shrink: 0;

    &-title {
      font-size: $font-md;
      font-weight: 700;
      color: $text-primary;
    }

    &-close {
      width: 56rpx;
      height: 56rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: $bg-hover;
      transition: $transition-fast;

      &:active {
        background: $border-color;
      }

      &-icon {
        width: 24rpx;
        height: 24rpx;
      }
    }
  }

  &-list {
    flex: 1;
    max-height: 55vh;
    width: 100%;
    box-sizing: border-box;
  }

  &-list-inner {
    padding: 0 $space-5;
    box-sizing: border-box;
  }

  &-item {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-4;
    border-radius: $radius-lg;
    transition: $transition-fast;
    margin-bottom: $space-3;
    border: 1rpx solid $border-light;
    background: $bg-card;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    width: 100%;

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

    &:last-child {
      margin-bottom: 0;
    }

    &:active {
      transform: scale(0.98);
      border-color: $primary;
    }

    &.is-active {
      border-color: $primary;
      background: $bg-card;

      .modal-item-name {
        color: $primary;
      }

      &::before {
        background: $primary;
        opacity: 0.6;
      }
    }

    &-avatar {
      width: 64rpx;
      height: 64rpx;
      border-radius: $radius-lg;
      background: $primary-gradient;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &-text {
        font-size: 28rpx;
        font-weight: 700;
        color: #fff;
      }
    }

    &-info {
      flex: 1;
      min-width: 0;
    }

    &-name {
      font-size: $font-base;
      font-weight: 600;
      color: $text-primary;
      display: block;
      margin-bottom: 4rpx;
    }

    &-meta {
      font-size: 22rpx;
      color: $text-hint;
    }

    &-check {
      width: 40rpx;
      height: 40rpx;
      border-radius: 50%;
      background: $primary-bg;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &-check-icon {
      font-size: 22rpx;
      color: $primary;
      font-weight: 700;
      line-height: 1;
    }
  }

  &-actions {
    display: flex;
    gap: $space-3;
    padding: $space-4 $space-5 calc($space-6 + env(safe-area-inset-bottom));
    flex-shrink: 0;
  }

  &-btn {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-lg;
    font-size: $font-base;
    font-weight: 600;
    border: 2rpx solid $border-color;
    color: $text-primary;
    transition: $transition-fast;

    &:active {
      transform: scale(0.97);
    }

    &--primary {
      background: $primary-gradient;
      border-color: transparent;
      color: #fff;
      box-shadow: 0 8rpx 24rpx rgba($primary, 0.3);
    }
  }
}

/* ============================================================
   弹窗入场动画
   ============================================================ */
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>

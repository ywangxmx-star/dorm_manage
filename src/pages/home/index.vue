<template>
  <view class="home-page">
    <view v-if="loading" class="loading-page">
      <view class="loading-spinner spinner-lg"></view>
      <text class="loading-text">正在整理宿舍动态...</text>
    </view>

    <template v-else-if="currentRoom">
      <view class="home-body">
        <view class="top">
          <view class="top-room" @click="showRoomPicker = true">
            <view class="top-room-avatar">
              <text class="top-room-avatar-text">{{ currentRoom.room_name.charAt(0) }}</text>
            </view>
            <view class="top-room-info">
              <text class="top-room-eyebrow">我的小窝</text>
              <view class="top-room-name-row">
                <text class="top-room-name">{{ currentRoom.room_name }}</text>
                <text class="top-room-caret">▾</text>
              </view>
            </view>
          </view>
          <view class="top-members" @click="goMembers">
            <text class="top-members-num">{{ currentRoom.member_count }}</text>
            <text class="top-members-lbl">室友</text>
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
          <view class="content">
            <view v-if="currentRoom.notice" class="notice">
              <view class="notice-tape"></view>
              <text class="notice-label">宿舍公告</text>
              <text class="notice-text">{{ currentRoom.notice }}</text>
            </view>

            <view class="bento">
              <view class="tile tile--task" @click="goTaskList">
                <view class="tile-top">
                  <view class="tile-icon tile-icon--light">
                    <image class="tile-icon-img" src="/static/icons/task.png" mode="aspectFit" />
                  </view>
                  <text class="tile-arrow tile-arrow--light">↗</text>
                </view>
                <view class="tile-bottom">
                  <text class="tile-num tile-num--light">{{ todayTasks.length }}</text>
                  <text class="tile-title tile-title--light">今日待办</text>
                  <text class="tile-desc tile-desc--light">{{ todayTasks.length ? '加油，马上搞定' : '今天很轻松' }}</text>
                </view>
              </view>

              <view class="bento-col">
                <view class="tile tile--bill" @click="goBillList">
                  <view class="tile-row">
                    <view class="tile-icon">
                      <image class="tile-icon-img" src="/static/icons/wallet.png" mode="aspectFit" />
                    </view>
                    <text class="tile-num">{{ unpaidBills.length }}</text>
                  </view>
                  <text class="tile-title">待付账单</text>
                </view>
                <view class="tile tile--vote" @click="goVoteList">
                  <view class="tile-row">
                    <view class="tile-icon">
                      <image class="tile-icon-img" src="/static/icons/receipt.png" mode="aspectFit" />
                    </view>
                    <text class="tile-num">{{ activeVotes.length }}</text>
                  </view>
                  <text class="tile-title">进行中投票</text>
                </view>
              </view>
            </view>

            <view class="quick">
              <view v-if="isLeader" class="quick-item" @click="goCreateTask">
                <view class="quick-dot quick-dot--blue">
                  <image class="quick-dot-img" src="/static/icons/task.png" mode="aspectFit" />
                </view>
                <text class="quick-text">发布任务</text>
              </view>
              <view class="quick-item" @click="goCreateBill">
                <view class="quick-dot quick-dot--lemon">
                  <image class="quick-dot-img" src="/static/icons/wallet.png" mode="aspectFit" />
                </view>
                <text class="quick-text">记一笔</text>
              </view>
              <view class="quick-item" @click="goBillList">
                <view class="quick-dot quick-dot--mint">
                  <image class="quick-dot-img" src="/static/icons/receipt.png" mode="aspectFit" />
                </view>
                <text class="quick-text">账单</text>
              </view>
              <view class="quick-item" @click="goMembers">
                <view class="quick-dot quick-dot--pink">
                  <image class="quick-dot-img" src="/static/icons/users.png" mode="aspectFit" />
                </view>
                <text class="quick-text">室友</text>
              </view>
            </view>

            <view class="block">
              <view class="block-hd">
                <view class="block-hd-left">
                  <text class="block-title">今日待办</text>
                  <text v-if="todayTasks.length" class="block-count">{{ todayTasks.length }}</text>
                </view>
                <text class="block-more" @click="goTaskList">全部 ›</text>
              </view>
              <view v-if="todayTasks.length" class="block-list">
                <TaskCard
                  v-for="task in visibleTasks"
                  :key="task.id"
                  :task="task"
                  @click="goTaskDetail(task.id)"
                />
                <view v-if="todayTasks.length > maxVisibleItems" class="block-expand" @click="toggleTasks">
                  <text class="block-expand-text">{{ showAllTasks ? '收起' : `再看 ${todayTasks.length - maxVisibleItems} 条` }}</text>
                </view>
              </view>
              <view v-else class="block-empty">
                <EmptyState icon="/static/icons/task.png" title="一切顺利" text="暂无待办任务" />
              </view>
            </view>

            <view class="block">
              <view class="block-hd">
                <view class="block-hd-left">
                  <text class="block-title">待付账单</text>
                  <text v-if="unpaidBills.length" class="block-count block-count--lemon">{{ unpaidBills.length }}</text>
                </view>
                <text class="block-more" @click="goBillList">全部 ›</text>
              </view>
              <view v-if="unpaidBills.length" class="block-list">
                <BillCard
                  v-for="bill in visibleBills"
                  :key="bill.id"
                  :bill="bill"
                  @click="goBillDetail(bill.id)"
                />
                <view v-if="unpaidBills.length > maxVisibleItems" class="block-expand" @click="toggleBills">
                  <text class="block-expand-text">{{ showAllBills ? '收起' : `再看 ${unpaidBills.length - maxVisibleItems} 条` }}</text>
                </view>
              </view>
              <view v-else class="block-empty">
                <EmptyState icon="/static/icons/wallet.png" title="账单已清" text="暂无待付账单" />
              </view>
            </view>

            <view class="safe-bottom"></view>
          </view>
        </scroll-view>
      </view>
    </template>

    <template v-else>
      <view class="welcome">
        <view class="welcome-art">
          <view class="welcome-sticker welcome-sticker--blue">
            <image class="welcome-sticker-img" src="/static/icons/app.png" mode="aspectFill" />
          </view>
          <view class="welcome-sticker welcome-sticker--lemon">
            <text class="welcome-sticker-text">记账</text>
          </view>
          <view class="welcome-sticker welcome-sticker--pink">
            <text class="welcome-sticker-text">值日</text>
          </view>
          <view class="welcome-sticker welcome-sticker--mint">
            <text class="welcome-sticker-text">投票</text>
          </view>
        </view>
        <view class="welcome-copy">
          <text class="welcome-title">和室友一起，{{ '\n' }}把日子过明白</text>
          <text class="welcome-desc">无论是校园宿舍还是合租公寓，值日、分账、投票都能在这里轻松搞定。</text>
        </view>
        <view class="welcome-actions">
          <view class="ui-btn ui-btn--primary" @click="goCreateRoom">创建宿舍</view>
          <view class="ui-btn ui-btn--ghost" @click="goJoinRoom">我有邀请码</view>
        </view>
      </view>
    </template>

    <view v-if="showRoomPicker" class="ui-sheet-mask" @click="showRoomPicker = false">
      <view class="ui-sheet" @click.stop>
        <view class="ui-sheet__handle"></view>
        <view class="sheet-head">
          <text class="ui-sheet__title">切换宿舍</text>
          <view class="sheet-close" @click="showRoomPicker = false">
            <image class="sheet-close-icon" src="/static/icons/x.png" mode="aspectFit" />
          </view>
        </view>
        <scroll-view scroll-y class="sheet-list">
          <view class="sheet-list-inner">
            <view
              v-for="room in myRooms"
              :key="room.id"
              class="sheet-item"
              :class="{ 'is-active': room.id === currentRoom?.id }"
              @click="switchRoom(room)"
            >
              <view class="sheet-item-avatar">
                <text class="sheet-item-avatar-text">{{ room.room_name.charAt(0) }}</text>
              </view>
              <view class="sheet-item-info">
                <text class="sheet-item-name">{{ room.room_name }}</text>
                <text class="sheet-item-meta">{{ room.member_count }} 位室友</text>
              </view>
              <view v-if="room.id === currentRoom?.id" class="sheet-item-check">
                <text class="sheet-item-check-icon">✓</text>
              </view>
            </view>
          </view>
        </scroll-view>
        <view class="sheet-actions">
          <view class="ui-btn ui-btn--ghost" @click="showRoomPicker = false; goCreateRoom()">创建宿舍</view>
          <view class="ui-btn ui-btn--primary" @click="showRoomPicker = false; goJoinRoom()">加入宿舍</view>
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

.home-page {
  min-height: 100vh;
  background-color: $bg-page;
}

.home-body {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.loading-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
}

.loading-text {
  font-size: $font-sm;
  color: $text-hint;
}

.page-content {
  flex: 1;
  height: 0;
}

.content {
  padding: 0 $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.safe-bottom {
  height: calc(env(safe-area-inset-bottom) + 24rpx);
}

/* -------- 顶部宿舍栏 -------- */
.top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: calc(var(--status-bar-height) + 32rpx) $space-5 $space-4;
}

.top-room {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
  min-width: 0;

  &:active {
    opacity: 0.8;
  }
}

.top-room-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 32rpx;
  background: $accent-lemon;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transform: rotate(-6deg);
  box-shadow: 0 8rpx 0 rgba(21, 34, 56, 0.08);

  &-text {
    font-size: 44rpx;
    font-weight: 900;
    color: $text-primary;
  }
}

.top-room-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-room-eyebrow {
  font-size: $font-xs;
  color: $text-hint;
  font-weight: 600;
}

.top-room-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.top-room-name {
  font-size: 44rpx;
  font-weight: 800;
  color: $text-primary;
  letter-spacing: -0.02em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.top-room-caret {
  font-size: $font-sm;
  color: $primary;
}

.top-members {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  padding: 14rpx 26rpx;
  background: $bg-card;
  border-radius: $radius-full;
  border: 2rpx solid $border-color;

  &-num {
    font-size: $font-base;
    font-weight: 800;
    color: $primary;
  }

  &-lbl {
    font-size: $font-xs;
    color: $text-secondary;
  }
}

/* -------- 公告便利贴 -------- */
.notice {
  position: relative;
  margin-top: $space-2;
  padding: $space-5 $space-4 $space-4;
  background: $accent-lemon-soft;
  border-radius: $radius-md;
  transform: rotate(-1deg);
  display: flex;
  flex-direction: column;
  gap: 8rpx;

  &-tape {
    position: absolute;
    top: -14rpx;
    left: 50%;
    width: 140rpx;
    height: 32rpx;
    margin-left: -70rpx;
    background: rgba(47, 124, 246, 0.25);
    border-radius: 6rpx;
    transform: rotate(3deg);
  }

  &-label {
    font-size: $font-xs;
    font-weight: 800;
    color: $accent-lemon-text;
  }

  &-text {
    font-size: $font-sm;
    color: $text-primary;
    line-height: 1.6;
  }
}

/* -------- 便当盒宫格 -------- */
.bento {
  display: flex;
  gap: $space-3;
}

.bento-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.tile {
  border-radius: $radius-lg;
  padding: $space-4;
  box-sizing: border-box;
  transition: $transition-fast;

  &:active {
    transform: scale(0.97);
  }

  &--task {
    flex: 1;
    min-height: 360rpx;
    background: $primary;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: $shadow-primary;
  }

  &--bill {
    flex: 1;
    background: $accent-lemon;
  }

  &--vote {
    flex: 1;
    background: $bg-card;
    border: 2rpx solid $border-color;
  }
}

.tile-top,
.tile-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tile-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;

  &--light {
    background: rgba(255, 255, 255, 0.22);
  }

  &-img {
    width: 36rpx;
    height: 36rpx;
  }
}

.tile--vote .tile-icon {
  background: $accent-violet-bg;
}

.tile-arrow {
  font-size: $font-md;
  font-weight: 700;

  &--light {
    color: rgba(255, 255, 255, 0.9);
  }
}

.tile-bottom {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.tile-num {
  font-size: 64rpx;
  font-weight: 900;
  line-height: 1;
  color: $text-primary;
  letter-spacing: -0.03em;

  &--light {
    font-size: 112rpx;
    color: $text-white;
  }
}

.tile-title {
  display: block;
  margin-top: $space-2;
  font-size: $font-sm;
  font-weight: 700;
  color: $text-primary;

  &--light {
    margin-top: $space-1;
    font-size: $font-base;
    color: $text-white;
  }
}

.tile-desc--light {
  font-size: $font-xs;
  color: rgba(255, 255, 255, 0.8);
}

/* -------- 快捷入口 -------- */
.quick {
  display: flex;
  justify-content: space-between;
  padding: $space-4 $space-3;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
}

.quick-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;

  &:active {
    opacity: 0.7;
  }
}

.quick-dot {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &--blue { background: $primary-bg; }
  &--lemon { background: $accent-lemon-soft; }
  &--mint { background: $success-bg; }
  &--pink { background: $accent-violet-bg; }

  &-img {
    width: 44rpx;
    height: 44rpx;
  }
}

.quick-text {
  font-size: $font-xs;
  font-weight: 600;
  color: $text-primary;
}

/* -------- 列表区块 -------- */
.block-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-3;
}

.block-hd-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.block-title {
  font-size: $font-md;
  font-weight: 800;
  color: $text-primary;
}

.block-count {
  min-width: 40rpx;
  height: 40rpx;
  padding: 0 12rpx;
  border-radius: $radius-full;
  background: $primary;
  color: $text-white;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 40rpx;
  text-align: center;
  box-sizing: border-box;

  &--lemon {
    background: $accent-lemon;
    color: $text-primary;
  }
}

.block-more {
  font-size: $font-xs;
  font-weight: 600;
  color: $text-secondary;
  padding: 8rpx 20rpx;
  background: $bg-card;
  border-radius: $radius-full;
}

.block-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.block-expand {
  display: flex;
  justify-content: center;
  padding: $space-2 0;

  &-text {
    font-size: $font-xs;
    font-weight: 600;
    color: $primary;
  }
}

.block-empty {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx dashed $border-color;
}

/* -------- 无宿舍欢迎页 -------- */
.welcome {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(var(--status-bar-height) + 120rpx) $space-6 calc(env(safe-area-inset-bottom) + 60rpx);
  display: flex;
  flex-direction: column;
  gap: $space-8;
}

.welcome-art {
  position: relative;
  height: 420rpx;
}

.welcome-sticker {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  box-shadow: 0 10rpx 0 rgba(21, 34, 56, 0.06);

  &--blue {
    left: 50%;
    top: 60rpx;
    width: 240rpx;
    height: 240rpx;
    margin-left: -120rpx;
    background: $primary;
    transform: rotate(-4deg);
    overflow: hidden;
  }

  &--lemon {
    left: 20rpx;
    top: 20rpx;
    padding: 18rpx 32rpx;
    background: $accent-lemon;
    transform: rotate(-10deg);
  }

  &--pink {
    right: 10rpx;
    top: 80rpx;
    padding: 18rpx 32rpx;
    background: $accent-violet;
    transform: rotate(8deg);
  }

  &--mint {
    left: 60rpx;
    bottom: 20rpx;
    padding: 18rpx 32rpx;
    background: $success;
    transform: rotate(6deg);
  }

  &-img {
    width: 100%;
    height: 100%;
  }

  &-text {
    font-size: $font-sm;
    font-weight: 800;
    color: $text-primary;
  }
}

.welcome-sticker--pink .welcome-sticker-text,
.welcome-sticker--mint .welcome-sticker-text {
  color: $text-white;
}

.welcome-copy {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.welcome-title {
  font-size: 60rpx;
  font-weight: 900;
  color: $text-primary;
  line-height: 1.25;
  letter-spacing: -0.02em;
  white-space: pre-line;
}

.welcome-desc {
  font-size: $font-sm;
  color: $text-secondary;
  line-height: 1.7;
}

.welcome-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

/* -------- 切换宿舍抽屉 -------- */
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-close {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $bg-card;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $space-3;

  &-icon {
    width: 28rpx;
    height: 28rpx;
  }
}

.sheet-list {
  max-height: 50vh;
}

.sheet-list-inner {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.sheet-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: $bg-card;
  border-radius: $radius-md;
  border: 3rpx solid transparent;

  &.is-active {
    border-color: $primary;
  }

  &-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 26rpx;
    background: $accent-lemon-soft;
    display: flex;
    align-items: center;
    justify-content: center;

    &-text {
      font-size: $font-md;
      font-weight: 800;
      color: $accent-lemon-text;
    }
  }

  &-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &-name {
    font-size: $font-base;
    font-weight: 700;
    color: $text-primary;
  }

  &-meta {
    font-size: $font-xs;
    color: $text-hint;
  }

  &-check {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    background: $primary;
    display: flex;
    align-items: center;
    justify-content: center;

    &-icon {
      font-size: 24rpx;
      color: $text-white;
      font-weight: 800;
    }
  }
}

.sheet-actions {
  display: flex;
  gap: $space-3;
  margin-top: $space-4;
}
</style>

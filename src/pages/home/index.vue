<template>
  <view class="home-page">
    <view v-if="loading" class="loading-page">
      <view class="loading-spinner spinner-lg"></view>
      <text class="loading-text">正在加载宿舍动态</text>
    </view>

    <template v-else-if="currentRoom">
      <view class="home-body">
        <view class="top">
          <view class="top-room" @click="showRoomPicker = true">
            <text class="top-room-eyebrow">{{ todayLabel }}</text>
            <view class="top-room-name-row">
              <text class="top-room-name">{{ currentRoom.room_name }}</text>
              <image class="top-room-caret" src="/static/icons/chevron-right.png" mode="aspectFit" />
            </view>
          </view>
          <view class="top-members" @click="goMembers">
            <image class="top-members-icon" src="/static/icons/users.png" mode="aspectFit" />
            <text class="top-members-num">{{ currentRoom.member_count }}</text>
          </view>
        </view>

        <scroll-view
          class="page-content"
          scroll-y
          :refresher-enabled="refresherEnabled"
          :refresher-threshold="REFRESHER_THRESHOLD"
          refresher-default-style="black"
          refresher-background="#F4F5F7"
          :upper-threshold="30"
          :refresher-triggered="refreshing"
          @scroll="onContentScroll"
          @scrolltoupper="onScrollToUpper"
          @refresherrestore="onRefresherRestore"
          @refresherrefresh="onRefresh"
        >
          <view class="content">
            <view class="overview slide-up">
              <view class="overview-hd">
                <text class="overview-title">今日概览</text>
                <text class="overview-hint">{{ summaryText }}</text>
              </view>
              <view class="overview-stats">
                <view class="stat" @click="goTaskList">
                  <text class="stat-num" :class="{ 'is-zero': !todayTasks.length }">{{ todayTasks.length }}</text>
                  <text class="stat-lbl">今日待办</text>
                </view>
                <view class="stat-divider"></view>
                <view class="stat" @click="goBillList">
                  <text class="stat-num" :class="{ 'is-zero': !unpaidBills.length }">{{ unpaidBills.length }}</text>
                  <text class="stat-lbl">待付账单</text>
                </view>
                <view class="stat-divider"></view>
                <view class="stat" @click="goVoteList">
                  <text class="stat-num" :class="{ 'is-zero': !activeVotes.length }">{{ activeVotes.length }}</text>
                  <text class="stat-lbl">进行中投票</text>
                </view>
              </view>
              <view v-if="currentRoom.notice" class="overview-notice">
                <text class="overview-notice-tag">公告</text>
                <text class="overview-notice-text">{{ currentRoom.notice }}</text>
              </view>
            </view>

            <view class="quick">
              <view v-if="isLeader" class="quick-item" @click="goCreateTask">
                <view class="quick-icon">
                  <image class="quick-icon-img" src="/static/icons/task.png" mode="aspectFit" />
                </view>
                <text class="quick-text">发布任务</text>
              </view>
              <view class="quick-item" @click="goCreateBill">
                <view class="quick-icon">
                  <image class="quick-icon-img" src="/static/icons/wallet.png" mode="aspectFit" />
                </view>
                <text class="quick-text">记一笔</text>
              </view>
              <view class="quick-item" @click="goVoteList">
                <view class="quick-icon">
                  <image class="quick-icon-img" src="/static/icons/vote.png" mode="aspectFit" />
                </view>
                <text class="quick-text">投票</text>
              </view>
              <view class="quick-item" @click="goMembers">
                <view class="quick-icon">
                  <image class="quick-icon-img" src="/static/icons/users.png" mode="aspectFit" />
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
                <view class="block-more" @click="goTaskList">
                  <text>全部</text>
                  <image class="block-more-icon" src="/static/icons/chevron-right.png" mode="aspectFit" />
                </view>
              </view>
              <view v-if="todayTasks.length" class="block-list">
                <TaskCard
                  v-for="task in visibleTasks"
                  :key="task.id"
                  :task="task"
                  @click="goTaskDetail(task.id)"
                />
                <view v-if="todayTasks.length > maxVisibleItems" class="block-expand" @click="toggleTasks">
                  <text class="block-expand-text">{{ showAllTasks ? '收起' : `展开其余 ${todayTasks.length - maxVisibleItems} 项` }}</text>
                </view>
              </view>
              <view v-else class="block-empty">
                <text class="block-empty-title">今天没有待办</text>
                <text class="block-empty-text">到期任务会出现在这里</text>
              </view>
            </view>

            <view class="block">
              <view class="block-hd">
                <view class="block-hd-left">
                  <text class="block-title">待付账单</text>
                  <text v-if="unpaidBills.length" class="block-count">{{ unpaidBills.length }}</text>
                </view>
                <view class="block-more" @click="goBillList">
                  <text>全部</text>
                  <image class="block-more-icon" src="/static/icons/chevron-right.png" mode="aspectFit" />
                </view>
              </view>
              <view v-if="unpaidBills.length" class="block-list">
                <BillCard
                  v-for="bill in visibleBills"
                  :key="bill.id"
                  :bill="bill"
                  @click="goBillDetail(bill.id)"
                />
                <view v-if="unpaidBills.length > maxVisibleItems" class="block-expand" @click="toggleBills">
                  <text class="block-expand-text">{{ showAllBills ? '收起' : `展开其余 ${unpaidBills.length - maxVisibleItems} 笔` }}</text>
                </view>
              </view>
              <view v-else class="block-empty">
                <text class="block-empty-title">账单都已结清</text>
                <text class="block-empty-text">新的公共开销可以点「记一笔」</text>
              </view>
            </view>

            <view class="safe-bottom"></view>
          </view>
        </scroll-view>
      </view>
    </template>

    <template v-else>
      <view class="welcome">
        <view class="welcome-main">
          <image class="welcome-logo" src="/static/icons/app.png" mode="aspectFill" />
          <view class="welcome-copy">
            <text class="welcome-title">和室友一起，把日子过明白</text>
            <text class="welcome-desc">校园宿舍或合租公寓都适用，值日、分账、投票集中在一处管理。</text>
          </view>
          <view class="features">
            <view v-for="f in features" :key="f.title" class="feature">
              <view class="feature-icon">
                <image class="feature-icon-img" :src="f.icon" mode="aspectFit" />
              </view>
              <view class="feature-info">
                <text class="feature-title">{{ f.title }}</text>
                <text class="feature-desc">{{ f.desc }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="welcome-actions">
          <view class="ui-btn ui-btn--primary" @click="goCreateRoom">创建宿舍</view>
          <view class="ui-btn ui-btn--ghost" @click="goJoinRoom">使用邀请码加入</view>
        </view>
      </view>
    </template>

    <RoomPickerSheet
      v-model="showRoomPicker"
      :rooms="myRooms"
      :current-room-id="currentRoom?.id"
      show-footer
      @select="switchRoom"
      @create="showRoomPicker = false; goCreateRoom()"
      @join="showRoomPicker = false; goJoinRoom()"
    />
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
import RoomPickerSheet from '@/components/RoomPickerSheet.vue'
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

const features = [
  { icon: '/static/icons/task.png', title: '值日与分工', desc: '发布任务、指派室友、到期提醒' },
  { icon: '/static/icons/wallet.png', title: '公共账单', desc: '水电网费自动分摊，谁付了一目了然' },
  { icon: '/static/icons/vote.png', title: '宿舍投票', desc: '大小事一起决定，结果实时可见' },
]

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

const todayLabel = computed(() => {
  const d = new Date()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${weekDays[d.getDay()]}`
})

const summaryText = computed(() => {
  const pending = todayTasks.value.length + unpaidBills.value.length + activeVotes.value.length
  return pending ? `共 ${pending} 项需要处理` : '暂无需要处理的事项'
})

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
  padding: 0 $page-gutter;
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.safe-bottom {
  height: calc(env(safe-area-inset-bottom) + 24rpx);
}

/* -------- 顶部 -------- */
.top {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-3;
  padding: calc(var(--status-bar-height) + 32rpx) $page-gutter $space-4;
}

.top-room {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;

  &:active {
    opacity: 0.7;
  }

  &-eyebrow {
    font-size: $font-xs;
    color: $text-hint;
  }

  &-name-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    min-width: 0;
  }

  &-name {
    font-size: $font-lg;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.25;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &-caret {
    width: 28rpx;
    height: 28rpx;
    flex-shrink: 0;
    opacity: 0.5;
    transform: rotate(90deg);
  }
}

.top-members {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;
  height: 64rpx;
  padding: 0 22rpx;
  background: $bg-card;
  border-radius: $radius-full;
  border: 1rpx solid $border-color;

  &:active {
    background: $bg-hover;
  }

  &-icon {
    width: 30rpx;
    height: 30rpx;
    opacity: 0.7;
  }

  &-num {
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
    font-variant-numeric: tabular-nums;
  }
}

/* -------- 今日概览 -------- */
.overview {
  background: $bg-card;
  border-radius: $radius-xl;
  border: 1rpx solid $border-light;
  box-shadow: $shadow-md;
  overflow: hidden;

  &-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx $space-4 0;
  }

  &-title {
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
  }

  &-hint {
    font-size: $font-xs;
    color: $text-hint;
  }

  &-stats {
    display: flex;
    align-items: center;
    padding: $space-4 0 $space-4;
  }

  &-notice {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
    padding: 24rpx $space-4;
    background: $bg-subtle;
    border-top: 1rpx solid $border-light;

    &-tag {
      flex-shrink: 0;
      padding: 2rpx 12rpx;
      border-radius: $radius-xs;
      background: $primary-bg;
      color: $primary;
      font-size: 22rpx;
      font-weight: 600;
      line-height: 1.6;
    }

    &-text {
      flex: 1;
      font-size: $font-xs;
      color: $text-secondary;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
  }
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;

  &:active {
    opacity: 0.6;
  }

  &-num {
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

  &-lbl {
    font-size: $font-xs;
    color: $text-secondary;
  }

  &-divider {
    width: 1rpx;
    height: 72rpx;
    background: $border-light;
  }
}

/* -------- 快捷入口 -------- */
.quick {
  display: flex;
  justify-content: space-between;
  padding: 0 $space-2;
}

.quick-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;

  &:active {
    opacity: 0.6;
  }
}

.quick-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: $radius-lg;
  background: $bg-card;
  border: 1rpx solid $border-light;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  justify-content: center;

  &-img {
    width: 44rpx;
    height: 44rpx;
  }
}

.quick-text {
  font-size: $font-xs;
  font-weight: 500;
  color: $text-primary;
}

/* -------- 列表区块 -------- */
.block {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.block-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }
}

.block-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.block-count {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 10rpx;
  border-radius: $radius-xs;
  background: $bg-hover;
  color: $text-secondary;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 36rpx;
  text-align: center;
  box-sizing: border-box;
}

.block-more {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: $font-xs;
  color: $text-secondary;

  &-icon {
    width: 24rpx;
    height: 24rpx;
    opacity: 0.5;
  }
}

.block-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.block-expand {
  display: flex;
  justify-content: center;
  padding: 20rpx 0;

  &-text {
    font-size: $font-xs;
    font-weight: 500;
    color: $primary;
  }
}

.block-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: $space-6 $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1rpx dashed $border-color;

  &-title {
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
  }

  &-text {
    font-size: $font-xs;
    color: $text-hint;
  }
}

/* -------- 未加入宿舍 -------- */
.welcome {
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: calc(var(--status-bar-height) + 120rpx) $page-gutter calc(env(safe-area-inset-bottom) + 48rpx);
}

.welcome-main {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.welcome-logo {
  width: 112rpx;
  height: 112rpx;
  border-radius: $radius-xl;
  box-shadow: $shadow-md;
}

.welcome-copy {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.welcome-title {
  font-size: 52rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.3;
}

.welcome-desc {
  font-size: $font-sm;
  color: $text-secondary;
  line-height: 1.6;
}

.features {
  background: $bg-card;
  border-radius: $radius-xl;
  border: 1rpx solid $border-light;
  padding: 0 $space-4;
}

.feature {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: 28rpx 0;
  border-bottom: 1rpx solid $border-light;

  &:last-child {
    border-bottom: none;
  }

  &-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: $radius-md;
    background: $primary-bg;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &-img {
      width: 36rpx;
      height: 36rpx;
    }
  }

  &-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    min-width: 0;
  }

  &-title {
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
  }

  &-desc {
    font-size: $font-xs;
    color: $text-hint;
  }
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding-top: $space-6;

  .ui-btn {
    flex: none;
    width: 100%;
  }
}
</style>

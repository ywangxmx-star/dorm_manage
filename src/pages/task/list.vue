<template>
  <view class="task-list-page">
    <view class="head">
      <view class="ui-header">
        <text class="ui-header__eyebrow">TO DO · 值日与分工</text>
        <view class="ui-header__row">
          <text class="ui-header__title">任务板</text>
          <view class="head-count">
            <text class="head-count-num">{{ currentTab === 'deleted' ? deletedTasks.length : tasks.length }}</text>
            <text class="head-count-lbl">项</text>
          </view>
        </view>
      </view>
      <scroll-view scroll-x class="seg-scroll" :show-scrollbar="false">
        <view class="ui-seg">
          <view
            v-for="tab in normalTabs"
            :key="tab.value"
            class="ui-seg__item"
            :class="{ 'is-active': currentTab === tab.value }"
            @click="switchTab(tab.value)"
          >
            <text>{{ tab.label }}</text>
          </view>
          <view
            v-if="isLeader"
            class="ui-seg__item seg-trash"
            :class="{ 'is-active': currentTab === 'deleted' }"
            @click="switchTab('deleted')"
          >
            <text>回收站</text>
          </view>
        </view>
      </scroll-view>
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
      <PageLoading v-if="isInitialLoading" />
      <template v-else>
        <view v-if="currentTab !== 'deleted'" class="list-wrap">
          <view v-if="tasks.length > 0" class="task-list">
            <TaskCard
              v-for="(task, index) in tasks"
              :key="task.id"
              :task="task"
              :style="{ animationDelay: index * 50 + 'ms' }"
              class="slide-up"
              @click="goDetail(task.id)"
            />
          </view>
          <view v-else-if="!loading" class="empty-box">
            <EmptyState text="这里空空的，去发布一个吧" title="还没有任务" />
          </view>
        </view>

        <view v-else class="list-wrap">
          <view class="trash-tip">
            <text class="trash-tip-text">删除的任务会保留 7 天，期间可随时恢复</text>
          </view>
          <view v-if="deletedTasks.length > 0" class="task-list">
            <view
              v-for="(task, index) in deletedTasks"
              :key="task.id"
              class="trash-card slide-up"
              :style="{ animationDelay: index * 50 + 'ms' }"
            >
              <view class="trash-info">
                <text class="trash-title">{{ task.title }}</text>
                <text class="trash-meta">{{ formatDeletedTime(task.deleted_at) }} 删除 · 剩余 {{ getRemainingDays(task.deleted_at) }} 天</text>
              </view>
              <view class="trash-btn" @click="handleRestore(task.id)">恢复</view>
            </view>
          </view>
          <view v-else-if="!loading" class="empty-box">
            <EmptyState text="暂无删除的任务" title="回收站为空" />
          </view>
        </view>

        <view v-if="showLoadMore" class="load-more">
          <view v-if="loading && !isInitialLoading" class="loading-wrap">
            <view class="loading-spinner spinner-sm"></view>
            <text class="load-more-text">加载中...</text>
          </view>
          <view v-else-if="hasMore" class="load-more-btn" @click="loadMore">
            <text class="load-more-text">加载更多</text>
          </view>
          <text v-else class="load-more-text">— 到底啦 —</text>
        </view>
        <view class="bottom-gap"></view>
      </template>
    </scroll-view>

    <view v-if="isLeader && currentTab !== 'deleted'" class="ui-fab" @click="goCreate">
      <text class="ui-fab__plus">+</text>
      <text class="ui-fab__text">发布任务</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRoomStore } from '@/stores/room'
import { useAuthStore } from '@/stores/auth'
import { useRequireLogin } from '@/composables/useRequireLogin'
import { getTaskList, getDeletedTaskList, restoreTask } from '@/api/task'
import { TASK_STATUS_OPTIONS } from '@/constants/task'
import TaskCard from '@/components/TaskCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageLoading from '@/components/PageLoading.vue'
import type { Task } from '@/types/task'

const PAGE_SIZE = 20

const roomStore = useRoomStore()
const authStore = useAuthStore()
const { requireLogin } = useRequireLogin()
const isLeader = computed(() => roomStore.currentRoom?.owner_id === authStore.userInfo?.id)
const REFRESHER_THRESHOLD = 80
const REFRESHER_SCROLL_LOCK = 10

const tasks = ref<Task[]>([])
const deletedTasks = ref<Task[]>([])
const loading = ref(false)
const refresherEnabled = ref(true)
const refreshing = ref(false)
const currentTab = ref<number | string>(-1)
const currentPage = ref(1)
const total = ref(0)

type TabValue = number | 'deleted'

const allTabs = computed(() => {
  const tabs = [...TASK_STATUS_OPTIONS]
  if (isLeader.value) {
    tabs.push({ value: 'deleted', label: '最近删除' })
  }
  return tabs
})

const normalTabs = computed(() => {
  return TASK_STATUS_OPTIONS
})

const hasMore = computed(() => {
  if (currentTab.value === 'deleted') {
    return deletedTasks.value.length < total.value
  }
  return tasks.value.length < total.value
})

const showLoadMore = computed(() => {
  if (currentTab.value === 'deleted') {
    return deletedTasks.value.length > 0
  }
  return tasks.value.length > 0
})

const isInitialLoading = computed(() => {
  if (!loading.value) return false
  if (currentTab.value === 'deleted') return deletedTasks.value.length === 0
  return tasks.value.length === 0
})

onShow(() => {
  refresherEnabled.value = true
  resetAndLoad()
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
  tasks.value = []
  deletedTasks.value = []
  currentPage.value = 1
  total.value = 0
  try {
    await loadList()
  } finally {
    refreshing.value = false
    refresherEnabled.value = true
  }
}

watch(isLeader, (newVal) => {
  if (!newVal && currentTab.value === 'deleted') {
    currentTab.value = -1
    resetAndLoad()
  }
})

function switchTab(value: TabValue) {
  currentTab.value = value
  resetAndLoad()
}

function resetAndLoad() {
  tasks.value = []
  deletedTasks.value = []
  currentPage.value = 1
  total.value = 0
  loadList()
}

function loadMore() {
  if (loading.value || !hasMore.value) return
  currentPage.value++
  loadList()
}

async function loadList() {
  const roomId = roomStore.currentRoom?.id
  if (!roomId) return
  loading.value = true
  try {
    if (currentTab.value === 'deleted') {
      const res = await getDeletedTaskList({
        room_id: roomId,
        page: currentPage.value,
        page_size: PAGE_SIZE,
      })
      if (currentPage.value === 1) {
        deletedTasks.value = res.data.items
      } else {
        deletedTasks.value = [...deletedTasks.value, ...res.data.items]
      }
      total.value = res.data.total
    } else {
      const params: { room_id: number; status?: number; page: number; page_size: number } = {
        room_id: roomId,
        page: currentPage.value,
        page_size: PAGE_SIZE,
      }
      if (typeof currentTab.value === 'number' && currentTab.value >= 0) {
        params.status = currentTab.value
      }
      const res = await getTaskList(params)
      if (currentPage.value === 1) {
        tasks.value = res.data.items
      } else {
        tasks.value = [...tasks.value, ...res.data.items]
      }
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

function formatDeletedTime(time: string | undefined) {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function getRemainingDays(time: string | undefined) {
  if (!time) return 7
  const deletedDate = new Date(time)
  const now = new Date()
  const diffTime = 7 * 24 * 60 * 60 * 1000 - (now.getTime() - deletedDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

async function handleRestore(taskId: number) {
  uni.showModal({
    title: '确认恢复',
    content: '确定要恢复该任务吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await restoreTask(taskId)
          uni.showToast({ title: '恢复成功', icon: 'success' })
          resetAndLoad()
        } catch { /* handled */ }
      }
    },
  })
}

function goDetail(id: number) { uni.navigateTo({ url: `/pages/task/detail?id=${id}` }) }
function goCreate() {
  requireLogin(() => uni.navigateTo({ url: '/pages/task/create' }))
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.task-list-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-page;
}

.head {
  flex-shrink: 0;
  padding-bottom: $space-3;
}

.head-count {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  padding: 10rpx 24rpx;
  background: $accent-lemon;
  border-radius: $radius-full;
  transform: rotate(-4deg);

  &-num {
    font-size: $font-md;
    font-weight: 900;
    color: $text-primary;
  }

  &-lbl {
    font-size: $font-xs;
    font-weight: 700;
    color: $text-primary;
  }
}

.seg-scroll {
  width: 100%;
  white-space: nowrap;
}

.seg-trash {
  border-style: dashed;
}

.page-content {
  flex: 1;
  height: 0;
}

.list-wrap {
  padding: $space-2 $space-5 0;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.empty-box {
  margin-top: $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx dashed $border-color;
}

.trash-tip {
  margin-bottom: $space-3;
  padding: $space-2 $space-3;
  background: $accent-lemon-soft;
  border-radius: $radius-md;

  &-text {
    font-size: $font-xs;
    color: $accent-lemon-text;
    font-weight: 600;
  }
}

.trash-card {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx dashed $border-color;
}

.trash-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.trash-title {
  font-size: $font-base;
  font-weight: 700;
  color: $text-secondary;
  text-decoration: line-through;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trash-meta {
  font-size: $font-xs;
  color: $text-hint;
}

.trash-btn {
  flex-shrink: 0;
  padding: 14rpx 32rpx;
  border-radius: $radius-full;
  background: $primary;
  color: $text-white;
  font-size: $font-xs;
  font-weight: 700;

  &:active {
    opacity: 0.85;
  }
}

.load-more {
  display: flex;
  justify-content: center;
  padding: $space-5 0;
}

.loading-wrap {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.load-more-btn {
  padding: 14rpx 40rpx;
  border-radius: $radius-full;
  background: $bg-card;
  border: 2rpx solid $border-color;
}

.load-more-text {
  font-size: $font-xs;
  color: $text-hint;
}

.bottom-gap {
  height: calc(env(safe-area-inset-bottom) + 200rpx);
}
</style>

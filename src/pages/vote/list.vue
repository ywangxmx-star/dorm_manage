<template>
  <view class="vote-list-page">
    <view class="sticky-header">
      <view class="header-bg-decor"></view>
      <view class="sticky-inner">
        <view class="sticky-top">
          <view class="sticky-title-row">
            <view class="sticky-icon-wrap">
              <image class="sticky-icon" src="/static/icons/vote.png" mode="aspectFit" />
            </view>
            <view class="sticky-title-group">
              <text class="sticky-title">投票</text>
              <text class="sticky-subtitle">{{ votes.length }} 个投票</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-x class="tab-bar" :show-scrollbar="false">
          <view
            v-for="tab in normalTabs"
            :key="tab.value"
            class="tab-item"
            :class="{ active: currentTab === tab.value }"
            @click="switchTab(tab.value)"
          >
            <text>{{ tab.label }}</text>
          </view>
          <view
            v-if="isLeader"
            class="tab-item tab-deleted"
            :class="{ active: currentTab === 'deleted' }"
            @click="switchTab('deleted')"
          >
            <text>最近删除</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 投票列表 -->
    <scroll-view
      class="page-content"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <PageLoading v-if="isInitialLoading" />
      <template v-else>
      <view v-if="currentTab !== 'deleted'">
        <view v-if="votes.length > 0" class="vote-list">
          <VoteCard
            v-for="(vote, index) in votes"
            :key="vote.id"
            :vote="vote"
            :class="{ 'slide-up': index > 0 }"
            :style="index > 0 ? { animationDelay: index * 50 + 'ms' } : undefined"
            @click="goDetail(vote.id)"
          />
        </view>
        <EmptyState v-else-if="!loading" text="暂无投票" title="投票列表为空" />
      </view>

      <!-- 最近删除列表 -->
      <view v-else>
        <view v-if="deletedVotes.length > 0" class="deleted-list-wrapper">
          <view
            v-for="(vote, index) in deletedVotes"
            :key="vote.id"
            class="deleted-vote-card card slide-up"
            :style="{ animationDelay: index * 50 + 'ms' }"
          >
            <view class="deleted-vote-info">
              <text class="deleted-vote-title">{{ vote.title }}</text>
              <view class="deleted-vote-meta">
                <text class="meta-text">{{ formatDeletedTime(vote.deleted_at) }}</text>
                <text class="meta-dot">·</text>
                <text class="meta-text">剩余 {{ getRemainingDays(vote.deleted_at) }} 天</text>
              </view>
            </view>
            <view class="deleted-vote-actions">
              <button class="btn-restore" @click="handleRestore(vote.id)">恢复</button>
            </view>
          </view>
        </view>
        <EmptyState v-else-if="!loading" text="暂无删除的投票" title="回收站为空" />
      </view>

      <!-- 加载更多 -->
      <view v-if="showLoadMore" class="load-more">
        <view v-if="loading && !isInitialLoading" class="loading-wrap">
          <view class="loading-spinner spinner-sm"></view>
          <text class="loading-text">加载中...</text>
        </view>
        <view v-else-if="hasMore" class="load-more-btn" @click="loadMore">
          <text class="load-more-text">加载更多</text>
        </view>
        <view v-else class="no-more">
          <text class="no-more-text">没有更多了</text>
        </view>
      </view>
      </template>
    </scroll-view>

    <view v-if="isLeader && currentTab !== 'deleted'" class="create-bar">
      <view class="create-bar-inner page-action-btn page-action-btn--primary" @click="goCreate">
        <view class="page-action-btn__icon">
          <text class="page-action-btn__icon-text">+</text>
        </view>
        <text class="page-action-btn__text">发起投票</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRoomStore } from '@/stores/room'
import { useAuthStore } from '@/stores/auth'
import { useRequireLogin } from '@/composables/useRequireLogin'
import { getVoteList, getDeletedVoteList, restoreVote } from '@/api/vote'
import { VOTE_STATUS_OPTIONS } from '@/constants/vote'
import VoteCard from '@/components/VoteCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageLoading from '@/components/PageLoading.vue'
import type { Vote } from '@/types/vote'

const PAGE_SIZE = 20

const roomStore = useRoomStore()
const authStore = useAuthStore()
const { requireLogin } = useRequireLogin()
const isLeader = computed(() => roomStore.currentRoom?.owner_id === authStore.userInfo?.id)
const votes = ref<Vote[]>([])
const deletedVotes = ref<Vote[]>([])
const loading = ref(false)
const refreshing = ref(false)
const currentTab = ref<number | string>(-1)
const currentPage = ref(1)
const total = ref(0)

type TabValue = number | 'deleted'

const allTabs = computed(() => {
  const tabs = [...VOTE_STATUS_OPTIONS]
  if (isLeader.value) {
    tabs.push({ value: 'deleted', label: '最近删除' })
  }
  return tabs
})

const normalTabs = computed(() => {
  return VOTE_STATUS_OPTIONS
})

const hasMore = computed(() => {
  if (currentTab.value === 'deleted') {
    return deletedVotes.value.length < total.value
  }
  return votes.value.length < total.value
})

const showLoadMore = computed(() => {
  if (currentTab.value === 'deleted') {
    return deletedVotes.value.length > 0
  }
  return votes.value.length > 0
})

const isInitialLoading = computed(() => {
  if (!loading.value) return false
  if (currentTab.value === 'deleted') return deletedVotes.value.length === 0
  return votes.value.length === 0
})

onShow(() => {
  resetAndLoad()
})

async function onRefresh() {
  refreshing.value = true
  votes.value = []
  deletedVotes.value = []
  currentPage.value = 1
  total.value = 0
  await loadList()
  refreshing.value = false
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
  votes.value = []
  deletedVotes.value = []
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
      const res = await getDeletedVoteList({
        room_id: roomId,
        page: currentPage.value,
        page_size: PAGE_SIZE,
      })
      if (currentPage.value === 1) {
        deletedVotes.value = res.data.items
      } else {
        deletedVotes.value = [...deletedVotes.value, ...res.data.items]
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
      const res = await getVoteList(params)
      if (currentPage.value === 1) {
        votes.value = res.data.items
      } else {
        votes.value = [...votes.value, ...res.data.items]
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

async function handleRestore(voteId: number) {
  uni.showModal({
    title: '确认恢复',
    content: '确定要恢复该投票吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await restoreVote(voteId)
          uni.showToast({ title: '恢复成功', icon: 'success' })
          resetAndLoad()
        } catch { /* handled */ }
      }
    },
  })
}

function goDetail(id: number) { uni.navigateTo({ url: `/pages/vote/detail?id=${id}` }) }
function goCreate() {
  requireLogin(() => uni.navigateTo({ url: '/pages/vote/create' }))
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.vote-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 100vh;
  padding: 0;
  box-sizing: border-box;
}

.page-content {
  flex: 1;
  height: 0;
  min-height: 0;
  box-sizing: border-box;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  overflow: hidden;
  background: $hero-gradient;
  padding-bottom: $space-3;
}

.header-bg-decor {
  position: absolute;
  top: -100rpx;
  right: -80rpx;
  width: 360rpx;
  height: 360rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 50%, transparent 70%);
  pointer-events: none;
}

.sticky-inner {
  position: relative;
  z-index: 1;
  padding: calc(var(--status-bar-height) + 20rpx) $space-5 $space-1;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.sticky-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sticky-title-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
  min-width: 0;
}

.sticky-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.sticky-icon {
  width: 34rpx;
  height: 34rpx;
  filter: brightness(0) invert(1);
}

.sticky-title-group {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.sticky-title {
  font-size: 42rpx;
  font-weight: 800;
  color: $text-white;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.sticky-subtitle {
  font-size: $font-xs;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  line-height: 1.3;
}

/* ---------- Tab 标签栏 ---------- */
.tab-bar {
  display: flex;
  gap: 0;
  white-space: nowrap;
  padding: 0 $space-1;
  position: relative;

  .tab-item {
    display: inline-block;
    padding: $space-2 $space-4;
    margin-right: $space-2;
    font-size: $font-sm;
    color: rgba(255, 255, 255, 0.65);
    font-weight: 500;
    border-radius: $radius-full;
    border: none;
    background: none;
    position: relative;
    transition: $transition-fast;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%) scaleX(0);
      width: 24rpx;
      height: 4rpx;
      border-radius: 2rpx;
      background-color: $text-white;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                  width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.active {
      color: $text-white;
      font-weight: 700;
      background-color: rgba(255, 255, 255, 0.18);

      &::after {
        transform: translateX(-50%) scaleX(1);
        width: 28rpx;
      }
    }

    &.tab-deleted {
      color: rgba(255, 255, 255, 0.65);
      font-weight: 500;

      &.active {
        color: $text-white;
        font-weight: 700;
        background-color: rgba(255, 255, 255, 0.18);

        &::after {
          background-color: $text-white;
        }
      }

      &::after {
        background-color: $text-white;
      }
    }

    &:active {
      opacity: 0.7;
    }
  }
}

.vote-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4 $space-4 200rpx;
  box-sizing: border-box;
}

.deleted-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4 $space-4 200rpx;
  box-sizing: border-box;
}

.deleted-vote-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4 $space-5;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: $text-hint;
    opacity: 0.3;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  .deleted-vote-info {
    flex: 1;

    .deleted-vote-title {
      font-size: $font-base;
      font-weight: 600;
      color: $text-primary;
      display: block;
      margin-bottom: $space-2;
    }

    .deleted-vote-meta {
      display: flex;
      align-items: center;
      gap: $space-2;

      .meta-text {
        font-size: $font-xs;
        color: $text-hint;
      }

      .meta-dot {
        font-size: $font-xs;
        color: $text-hint;
      }
    }
  }

  .deleted-vote-actions {
    margin-left: $space-4;

    .btn-restore {
      font-size: $font-sm;
      color: $primary;
      background-color: $primary-bg;
      border: none;
      padding: $space-2 $space-4;
      border-radius: $radius-full;
      font-weight: 500;

      &:active {
        opacity: 0.8;
      }
    }
  }
}

.load-more {
  padding: $space-6 0;

  .loading-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-3;

    .loading-text {
      font-size: $font-sm;
      color: $text-hint;
    }
  }

  .load-more-btn {
    text-align: center;
    padding: $space-3;
    background-color: $bg-card;
    border-radius: $radius-lg;
    border: 1rpx solid $border-color;
    box-shadow: $shadow-sm;

    &:active {
      background-color: $bg-hover;
    }

    .load-more-text {
      font-size: $font-sm;
      color: $primary;
      font-weight: 500;
    }
  }

  .no-more {
    text-align: center;

    .no-more-text {
      font-size: $font-xs;
      color: $text-hint;
    }
  }
}

.create-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: $space-4 $space-5;
  padding-bottom: calc($space-4 + constant(safe-area-inset-bottom));
  padding-bottom: calc($space-4 + env(safe-area-inset-bottom));
  background: linear-gradient(transparent, $bg-page 40%);
  z-index: 50;
  pointer-events: none;
}

.create-bar-inner {
  pointer-events: auto;
}
</style>

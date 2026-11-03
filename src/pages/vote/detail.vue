<template>
  <view class="vote-detail-page">
    <view v-if="loading" class="loading-wrap">
      <view class="loading-spinner"></view>
    </view>

    <template v-else-if="vote">
      <!-- 顶部渐变横幅 -->
      <view class="hero-banner">
        <view class="hero-bg-deco"></view>
        <view class="hero-content">
          <view class="hero-tags">
            <view class="hero-tag" :style="{ backgroundColor: voteTypeColor + '20', color: voteTypeColor }">
              {{ voteTypeText }}
            </view>
            <view class="hero-tag" :style="{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }">
              {{ statusInfo.text }}
            </view>
            <view v-if="vote.vote_type === 1" class="hero-tag hero-tag-anonymous">实名</view>
            <view v-else class="hero-tag hero-tag-anonymous hero-tag-secret">匿名</view>
          </view>
          <text class="hero-title">{{ vote.title }}</text>
          <text v-if="vote.description" class="hero-desc">{{ vote.description }}</text>
          <view class="hero-meta-row">
            <view class="hero-meta-item">
              <text class="hero-meta-icon">👤</text>
              <text class="hero-meta-text">{{ vote.creator_name || '匿名' }}</text>
            </view>
            <view class="hero-meta-divider"></view>
            <view class="hero-meta-item">
              <text class="hero-meta-icon">📊</text>
              <text class="hero-meta-text">{{ vote.total_voters }}人参与</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 信息卡片 -->
      <view class="info-grid">
        <view class="info-item">
          <view class="info-icon-wrap" style="background: rgba(20, 184, 166, 0.12);">
            <text class="info-icon">⏰</text>
          </view>
          <view class="info-body">
            <text class="info-label">截止时间</text>
            <text class="info-value">{{ formatDeadline(vote.deadline) }}</text>
          </view>
        </view>
        <view class="info-item">
          <view class="info-icon-wrap" style="background: rgba(99, 102, 241, 0.12);">
            <text class="info-icon">🎯</text>
          </view>
          <view class="info-body">
            <text class="info-label">选择类型</text>
            <text class="info-value">{{ selectTypeText }}</text>
          </view>
        </view>
      </view>

      <!-- 选项列表 -->
      <view class="options-section">
        <view class="section-header">
          <text class="section-title">投票选项</text>
          <text class="section-sub">共 {{ vote.options.length }} 项</text>
        </view>
        <view
          v-for="(opt, idx) in vote.options"
          :key="opt.id"
          class="option-card"
          :class="{
            selected: selectedOptions.includes(opt.id),
            disabled: !canVote,
            'is-leader': isLeaderOption(opt)
          }"
          @click="toggleOption(opt.id)"
        >
          <view class="option-top">
            <view class="option-check">
              <view v-if="selectedOptions.includes(opt.id)" class="check-circle active">✓</view>
              <view v-else class="check-circle"></view>
            </view>
            <text class="option-label" :style="{ background: barColors[idx] }">{{ optionLabels[idx] }}</text>
            <text class="option-content">{{ opt.content }}</text>
            <view class="option-pct" :style="{ color: barColors[idx] }">
              <text class="pct-num">{{ getPercentage(opt.vote_count) }}</text>
              <text class="pct-sign">%</text>
            </view>
          </view>
          <view class="option-bar-wrap">
            <view class="option-bar">
              <view
                class="option-bar-fill"
                :style="{
                  width: getPercentage(opt.vote_count) + '%',
                  background: barColors[idx]
                }"
              ></view>
            </view>
            <text class="option-count">{{ opt.vote_count }}票</text>
          </view>
          <view class="option-badge-row">
            <view v-if="isLeaderOption(opt)" class="leader-badge">
              <text class="leader-badge-icon">👑</text>
              <text class="leader-badge-text">领先</text>
            </view>
          </view>
          <view v-if="vote.vote_type === 1 && opt.voters.length > 0" class="option-voters">
            <text class="voters-label">{{ opt.voters.map(v => v.nickname).join('、') }}</text>
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view v-if="canVote" class="action-section">
        <button class="btn-submit" :loading="submitting" @click="handleSubmitVote">
          <text class="btn-submit-text">提交投票</text>
        </button>
        <text class="action-hint">选择后点击提交，提交后不可修改</text>
      </view>

      <!-- 宿舍长操作 -->
      <view v-if="isLeader && vote.status === 0" class="leader-actions">
        <view class="action-btn" @click="handleCloseVote">
          <text class="action-btn-text">结束投票</text>
        </view>
        <view class="action-btn action-btn-danger" @click="handleDeleteVote">
          <text class="action-btn-text">删除投票</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRoomStore } from '@/stores/room'
import { useAuthStore } from '@/stores/auth'
import { getVoteDetail, submitVote, closeVote, deleteVote } from '@/api/vote'
import { VOTE_STATUS_MAP, VOTE_TYPE_MAP, SELECT_TYPE_MAP } from '@/constants/vote'
import type { Vote } from '@/types/vote'

const roomStore = useRoomStore()
const authStore = useAuthStore()
const isLeader = computed(() => roomStore.currentRoom?.owner_id === authStore.userInfo?.id)

const vote = ref<Vote | null>(null)
const loading = ref(true)
const submitting = ref(false)
const selectedOptions = ref<number[]>([])

const canVote = computed(() => {
  if (!vote.value) return false
  return vote.value.status === 0 && !vote.value.has_voted
})

const statusInfo = computed(() => {
  if (!vote.value) return { text: '未知', color: '#94A3B8' }
  return VOTE_STATUS_MAP[vote.value.status] || { text: '未知', color: '#94A3B8' }
})

const voteTypeText = computed(() => {
  if (!vote.value) return ''
  return VOTE_TYPE_MAP[vote.value.vote_type] || '未知'
})

const voteTypeColor = computed(() => vote.value?.vote_type === 1 ? '#10B981' : '#6366F1')

const selectTypeText = computed(() => {
  if (!vote.value) return ''
  if (vote.value.select_type === 0) return '单选'
  if (vote.value.select_type === 1) return `必选${vote.value.select_count}项`
  return `最多选${vote.value.select_count}项`
})

const barColors = ['#14B8A6', '#6366F1', '#F59E0B', '#F43F5E', '#0EA5E9', '#8B5CF6', '#10B981', '#EF4444']

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']

const maxVoteCount = computed(() => {
  if (!vote.value || vote.value.options.length === 0) return 0
  return Math.max(...vote.value.options.map(o => o.vote_count))
})

function isLeaderOption(opt: { vote_count: number }) {
  return maxVoteCount.value > 0 && opt.vote_count === maxVoteCount.value && opt.vote_count > 0
}

onLoad((options) => {
  if (options?.id) {
    loadDetail(Number(options.id))
  }
})

async function loadDetail(id: number) {
  loading.value = true
  try {
    const res = await getVoteDetail(id)
    vote.value = res.data
  } finally {
    loading.value = false
  }
}

function getPercentage(count: number) {
  if (!vote.value || vote.value.total_voters === 0) return 0
  return Math.round((count / vote.value.total_voters) * 100)
}

function toggleOption(optionId: number) {
  if (!canVote.value) return

  if (!vote.value) return

  if (vote.value.select_type === 0) {
    // 单选
    selectedOptions.value = [optionId]
  } else if (vote.value.select_type === 1) {
    // 必选N项
    const index = selectedOptions.value.indexOf(optionId)
    if (index > -1) {
      selectedOptions.value.splice(index, 1)
    } else {
      if (selectedOptions.value.length < vote.value.select_count) {
        selectedOptions.value.push(optionId)
      } else {
        uni.showToast({ title: `只能选择${vote.value.select_count}项`, icon: 'none' })
      }
    }
  } else {
    // 最多选N项
    const index = selectedOptions.value.indexOf(optionId)
    if (index > -1) {
      selectedOptions.value.splice(index, 1)
    } else {
      if (selectedOptions.value.length < vote.value.select_count) {
        selectedOptions.value.push(optionId)
      } else {
        uni.showToast({ title: `最多选择${vote.value.select_count}项`, icon: 'none' })
      }
    }
  }
}

async function handleSubmitVote() {
  if (!vote.value) return

  if (selectedOptions.value.length === 0) {
    uni.showToast({ title: '请选择选项', icon: 'none' })
    return
  }

  if (vote.value.select_type === 1 && selectedOptions.value.length !== vote.value.select_count) {
    uni.showToast({ title: `必须选择${vote.value.select_count}项`, icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const res = await submitVote(vote.value.id, selectedOptions.value)
    vote.value = res.data
    uni.showToast({ title: '投票成功', icon: 'success' })
  } finally {
    submitting.value = false
  }
}

async function handleCloseVote() {
  if (!vote.value) return

  uni.showModal({
    title: '确认结束',
    content: '确定要结束该投票吗？结束后将无法再投票。',
    success: async (res) => {
      if (res.confirm && vote.value) {
        try {
          const result = await closeVote(vote.value.id)
          vote.value = result.data
          uni.showToast({ title: '已结束', icon: 'success' })
        } catch { /* handled */ }
      }
    },
  })
}

async function handleDeleteVote() {
  if (!vote.value) return

  uni.showModal({
    title: '确认删除',
    content: '确定要删除该投票吗？',
    success: async (res) => {
      if (res.confirm && vote.value) {
        try {
          await deleteVote(vote.value.id)
          uni.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1500)
        } catch { /* handled */ }
      }
    },
  })
}

function formatDeadline(deadline: string) {
  const date = new Date(deadline)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.vote-detail-page {
  padding: 0;
  padding-bottom: 160rpx;
  min-height: 100vh;
  background: $bg-page;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400rpx;
}

/* ==========================================
   顶部渐变横幅
   ========================================== */
.hero-banner {
  position: relative;
  background: linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #2DD4BF 100%);
  padding: calc(var(--status-bar-height) + 24rpx) $space-4 $space-6;
  overflow: hidden;
}

.hero-bg-deco {
  position: absolute;
  top: -80rpx;
  right: -60rpx;
  width: 360rpx;
  height: 360rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.hero-bg-deco::after {
  content: '';
  position: absolute;
  bottom: -60rpx;
  left: -40rpx;
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-tags {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-3;
}

.hero-tag {
  font-size: 22rpx;
  padding: $space-1 $space-3;
  border-radius: $radius-full;
  font-weight: 600;
  line-height: 1.2;
}

.hero-tag-anonymous {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.hero-tag-secret {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.hero-title {
  font-size: $font-lg;
  font-weight: 800;
  color: #fff;
  line-height: 1.3;
  display: block;
  margin-bottom: $space-2;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.hero-desc {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  display: block;
  margin-bottom: $space-3;
}

.hero-meta-row {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.hero-meta-item {
  display: flex;
  align-items: center;
  gap: $space-1;
}

.hero-meta-icon {
  font-size: 24rpx;
}

.hero-meta-text {
  font-size: $font-xs;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.hero-meta-divider {
  width: 2rpx;
  height: 20rpx;
  background: rgba(255, 255, 255, 0.3);
}

/* ==========================================
   信息网格
   ========================================== */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
  padding: $space-3;
  margin-top: -$space-4;
  position: relative;
  z-index: 2;
}

.info-item {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-3;
  display: flex;
  align-items: center;
  gap: $space-2;
  box-shadow: $shadow-sm;
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
    background: $accent-teal;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }
}

.info-icon-wrap {
  width: 48rpx;
  height: 48rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon {
  font-size: 24rpx;
}

.info-body {
  flex: 1;
  min-width: 0;
}

.info-label {
  font-size: $font-xs;
  color: $text-hint;
  display: block;
  margin-bottom: 2rpx;
}

.info-value {
  font-size: $font-sm;
  color: $text-primary;
  font-weight: 600;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==========================================
   投票选项区域
   ========================================== */
.options-section {
  padding: 0 $space-3;
  margin-top: $space-2;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-2;
  padding: 0 $space-1;
}

.section-title {
  font-size: $font-base;
  font-weight: 700;
  color: $text-primary;
}

.section-sub {
  font-size: $font-xs;
  color: $text-hint;
  font-weight: 500;
}

/* ------------------------------------------
   单个选项卡片
   ------------------------------------------ */
.option-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-3 $space-4;
  margin-bottom: $space-2;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-color;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: $accent-teal;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  &.disabled {
    opacity: 0.85;
  }

  &.selected {
    border-color: $accent-teal;
    box-shadow: 0 4rpx 16rpx rgba(20, 184, 166, 0.15);

    .option-top .check-circle {
      border-color: $accent-teal;
    }
  }

  &.is-leader {
    border-color: rgba($accent-teal, 0.4);
    background: linear-gradient(135deg, #F0FDFA 0%, $bg-card 60%);
  }

  &:active:not(.disabled) {
    transform: scale(0.99);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .option-top {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin-bottom: $space-2;

    .option-check {
      flex-shrink: 0;
    }

    .check-circle {
      width: 36rpx;
      height: 36rpx;
      border-radius: 50%;
      border: 2rpx solid #D1D5DB;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20rpx;
      color: transparent;
      transition: all 0.2s ease;

      &.active {
        border-color: $accent-teal;
        background: $accent-teal;
        color: #fff;
        box-shadow: 0 2rpx 8rpx rgba(20, 184, 166, 0.3);
      }
    }

    .option-label {
      width: 36rpx;
      height: 36rpx;
      border-radius: $radius-sm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20rpx;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .option-content {
      flex: 1;
      font-size: $font-sm;
      color: $text-primary;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .option-pct {
      display: flex;
      align-items: baseline;
      gap: 2rpx;
      flex-shrink: 0;
      min-width: 60rpx;
      text-align: right;
      justify-content: flex-end;

      .pct-num {
        font-size: $font-base;
        font-weight: 800;
        line-height: 1;
      }

      .pct-sign {
        font-size: 20rpx;
        font-weight: 600;
      }
    }
  }

  .option-bar-wrap {
    display: flex;
    align-items: center;
    gap: $space-2;

    .option-bar {
      flex: 1;
      height: 8rpx;
      background-color: #F1F5F9;
      border-radius: $radius-full;
      overflow: hidden;

      .option-bar-fill {
        height: 100%;
        border-radius: $radius-full;
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 0;
      }
    }

    .option-count {
      font-size: 22rpx;
      color: $text-hint;
      flex-shrink: 0;
      min-width: 36rpx;
      text-align: right;
    }
  }

  .option-badge-row {
    display: flex;
    align-items: center;
    margin-top: $space-2;
    min-height: 28rpx;
  }

  .leader-badge {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    background: linear-gradient(135deg, #FEF3C7, #FDE68A);
    padding: 2rpx $space-2;
    border-radius: $radius-full;

    .leader-badge-icon {
      font-size: 20rpx;
    }

    .leader-badge-text {
      font-size: 20rpx;
      font-weight: 700;
      color: #B45309;
    }
  }

  .option-voters {
    margin-top: $space-2;
    padding: $space-1 $space-2;
    background: #FAFAFA;
    border-radius: $radius-sm;

    .voters-label {
      font-size: 20rpx;
      color: $text-secondary;
      line-height: 1.4;
    }
  }
}

/* ==========================================
   提交按钮
   ========================================== */
.action-section {
  padding: $space-3 $space-3 0;

  .btn-submit {
    width: 100%;
    height: 96rpx;
    background: $primary-gradient;
    border: none;
    border-radius: $radius-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6rpx 24rpx rgba($primary, 0.35);
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.08), transparent);
      transform: rotate(45deg);
      transition: all 0.4s ease;
    }

    &:active {
      transform: scale(0.97);
      box-shadow: 0 3rpx 12rpx rgba($primary, 0.25);

      &::after {
        transform: rotate(45deg) translateX(100%);
      }
    }

    .btn-submit-text {
      font-size: $font-base;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.02em;
    }
  }

  .action-hint {
    display: block;
    text-align: center;
    font-size: 22rpx;
    color: $text-hint;
    margin-top: $space-2;
  }
}

/* ==========================================
   宿舍长操作
   ========================================== */
.leader-actions {
  display: flex;
  gap: $space-3;
  padding: $space-3;

  .action-btn {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-lg;
    background: $bg-card;
    border: 2rpx solid $border-color;
    box-shadow: $shadow-sm;
    transition: all 0.15s ease;

    &:active {
      transform: scale(0.97);
      background: $bg-hover;
    }

    .action-btn-text {
      font-size: $font-sm;
      color: $text-secondary;
      font-weight: 600;
    }

    &.action-btn-danger {
      border-color: rgba($danger, 0.2);
      background: rgba($danger, 0.04);

      &:active {
        background: rgba($danger, 0.1);
      }

      .action-btn-text {
        color: $danger;
      }
    }
  }
}
</style>

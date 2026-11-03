<template>
  <view class="vote-card" @click="$emit('click')">
    <view class="vote-header">
      <text class="vote-title">{{ vote.title }}</text>
      <view class="header-tags">
        <view class="type-tag" :style="{ backgroundColor: voteTypeColor + '14', color: voteTypeColor }">
          {{ voteTypeText }}
        </view>
        <view v-if="vote.has_voted" class="voted-tag-inline">
          ✓ 已投票
        </view>
        <view v-else class="status-tag" :style="{ backgroundColor: statusInfo.color + '14', color: statusInfo.color }">
          {{ statusInfo.text }}
        </view>
      </view>
    </view>
    <view class="vote-desc" v-if="vote.description">
      <text class="desc-text">{{ vote.description }}</text>
    </view>
    <view class="vote-meta">
      <view class="meta-item">
        <text class="meta-icon-text">👤</text>
        <text>{{ vote.creator_name || '匿名' }}</text>
      </view>
      <view class="meta-item">
        <text class="meta-icon-text">📊</text>
        <text>{{ vote.total_voters }}人已投</text>
      </view>
      <view class="meta-item">
        <text class="meta-icon-text">⏰</text>
        <text>{{ formatDeadline(vote.deadline) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VOTE_STATUS_MAP, VOTE_TYPE_MAP } from '@/constants/vote'
import type { Vote } from '@/types/vote'

const props = defineProps<{
  vote: Vote
}>()

defineEmits(['click'])

const statusInfo = computed(() => VOTE_STATUS_MAP[props.vote.status] || { text: '未知', color: '#94A3B8' })

const voteTypeText = computed(() => VOTE_TYPE_MAP[props.vote.vote_type] || '未知')
const voteTypeColor = computed(() => props.vote.vote_type === 1 ? '#10B981' : '#6366F1')

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

.vote-card {
  background-color: $bg-card;
  border-radius: $radius-xl;
  padding: $space-4;
  margin-bottom: $space-2;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-color;
  transition: $transition-base;
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

  &:active {
    transform: scale(0.98);
  }

  .vote-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $space-2;

    .vote-title {
      font-size: $font-md;
      font-weight: 600;
      color: $text-primary;
      flex: 1;
      margin-right: $space-3;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .header-tags {
      display: flex;
      align-items: center;
      gap: $space-2;
      flex-shrink: 0;
    }

    .type-tag,
    .status-tag {
      font-size: $font-xs;
      padding: $space-1 $space-3;
      border-radius: $radius-full;
      white-space: nowrap;
      font-weight: 500;
      line-height: 1.2;
    }

    .voted-tag-inline {
      font-size: $font-xs;
      padding: $space-1 $space-3;
      border-radius: $radius-full;
      background-color: $success-bg;
      color: $success;
      font-weight: 600;
      white-space: nowrap;
      line-height: 1.2;
    }
  }

  .vote-desc {
    margin-bottom: $space-2;

    .desc-text {
      font-size: $font-sm;
      color: $text-secondary;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
  }

  .vote-meta {
    display: flex;
    align-items: center;
    gap: $space-3;
    font-size: $font-sm;
    color: $text-secondary;

    .meta-item {
      display: flex;
      align-items: center;
      gap: $space-1;

      .meta-icon-text {
        font-size: $font-sm;
      }
    }
  }
}
</style>

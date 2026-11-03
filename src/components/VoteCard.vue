<template>
  <view class="vote-card" @click="$emit('click')">
    <view class="vc-top">
      <view class="vc-type" :style="{ backgroundColor: voteTypeColor + '1A', color: voteTypeColor }">{{ voteTypeText }}</view>
      <view v-if="vote.has_voted" class="vc-voted">已投票</view>
      <view v-else class="vc-status" :style="{ color: statusInfo.color }">
        <view class="vc-status-dot" :style="{ backgroundColor: statusInfo.color }"></view>
        <text>{{ statusInfo.text }}</text>
      </view>
    </view>
    <text class="vc-title">{{ vote.title }}</text>
    <text v-if="vote.description" class="vc-desc">{{ vote.description }}</text>
    <view class="vc-foot">
      <view class="vc-count">
        <text class="vc-count-num">{{ vote.total_voters }}</text>
        <text class="vc-count-lbl">人已投</text>
      </view>
      <text class="vc-meta">{{ vote.creator_name || '匿名' }} · 截止 {{ formatDeadline(vote.deadline) }}</text>
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

const statusInfo = computed(() => VOTE_STATUS_MAP[props.vote.status] || { text: '未知', color: '#9AA8BC' })

const voteTypeText = computed(() => VOTE_TYPE_MAP[props.vote.vote_type] || '未知')
const voteTypeColor = computed(() => props.vote.vote_type === 1 ? '#14B88A' : '#2F7CF6')

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
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-4;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  transition: $transition-fast;

  &:active {
    transform: scale(0.98);
  }
}

.vc-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.vc-type {
  padding: 6rpx 18rpx;
  border-radius: $radius-full;
  font-size: 22rpx;
  font-weight: 700;
}

.vc-voted {
  padding: 6rpx 18rpx;
  border-radius: $radius-full;
  background: $accent-lemon;
  color: $text-primary;
  font-size: 22rpx;
  font-weight: 800;
}

.vc-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  font-weight: 700;

  &-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
  }
}

.vc-title {
  font-size: $font-base;
  font-weight: 800;
  color: $text-primary;
  line-height: 1.4;
}

.vc-desc {
  font-size: $font-xs;
  color: $text-secondary;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.vc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding-top: $space-2;
  border-top: 2rpx dashed $border-color;
}

.vc-count {
  display: flex;
  align-items: baseline;
  gap: 6rpx;

  &-num {
    font-size: $font-md;
    font-weight: 900;
    color: $primary;
  }

  &-lbl {
    font-size: $font-xs;
    color: $text-secondary;
  }
}

.vc-meta {
  font-size: 22rpx;
  color: $text-hint;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<template>
  <view class="task-card" @click="$emit('click')">
    <view class="tc-top">
      <view class="tc-status" :style="{ backgroundColor: statusInfo.color + '1A', color: statusInfo.color }">
        <view class="tc-status-dot" :style="{ backgroundColor: statusInfo.color }"></view>
        <text>{{ statusInfo.text }}</text>
      </view>
      <view v-if="task.is_urged" class="tc-urge">被催啦</view>
      <text class="tc-time">{{ formatDate(task.create_time, 'MM-DD HH:mm') }}</text>
    </view>
    <text class="tc-title" :style="{ color: titleColor }">{{ task.title }}</text>
    <view class="tc-people">
      <view class="tc-person">
        <view class="tc-avatar tc-avatar--from">
          <text class="tc-avatar-text">{{ (task.assign_user_name || '-').charAt(0) }}</text>
        </view>
        <text class="tc-name">{{ task.assign_user_name || '-' }}</text>
      </view>
      <text class="tc-arrow">→</text>
      <view class="tc-person tc-person--grow">
        <view class="tc-avatar tc-avatar--to">
          <text class="tc-avatar-text">{{ executorNames.charAt(0) }}</text>
        </view>
        <text class="tc-name">{{ executorNames }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TaskStatusMap } from '@/types/task'
import type { Task } from '@/types/task'
import { PRIORITY_OPTIONS } from '@/constants/task'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  task: Task
}>()

defineEmits(['click'])

const statusInfo = computed(() => TaskStatusMap[props.task.status] || { text: '未知', color: '#9AA8BC' })
const executorNames = computed(() => {
  const names = props.task.executors?.map(e => e.nickname).filter(Boolean) || []
  return names.length > 0 ? names.join('、') : '-'
})

const titleColor = computed(() => {
  if (props.task.priority === 0) return '#152238'
  return PRIORITY_OPTIONS.find(p => p.value === props.task.priority)?.color || '#152238'
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.task-card {
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

.tc-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.tc-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 6rpx 18rpx;
  border-radius: $radius-full;
  font-size: 22rpx;
  font-weight: 700;

  &-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
  }
}

.tc-urge {
  padding: 6rpx 16rpx;
  border-radius: $radius-full;
  background: $accent-lemon;
  color: $text-primary;
  font-size: 22rpx;
  font-weight: 800;
  transform: rotate(-3deg);
}

.tc-time {
  margin-left: auto;
  font-size: 22rpx;
  color: $text-hint;
}

.tc-title {
  font-size: $font-base;
  font-weight: 800;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tc-people {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 18rpx;
  background: $bg-page;
  border-radius: $radius-md;
}

.tc-person {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;

  &--grow {
    flex: 1;
  }
}

.tc-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--from { background: $accent-lemon; }
  &--to { background: $primary; }

  &-text {
    font-size: 20rpx;
    font-weight: 800;
    color: $text-primary;
  }
}

.tc-avatar--to .tc-avatar-text {
  color: $text-white;
}

.tc-name {
  font-size: $font-xs;
  color: $text-secondary;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tc-arrow {
  font-size: $font-xs;
  color: $text-hint;
}
</style>

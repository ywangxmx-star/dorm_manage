<template>
  <view class="task-card" @click="$emit('click')">
    <view class="tc-head">
      <text class="tc-title">{{ task.title }}</text>
      <view class="tc-status" :style="{ backgroundColor: statusInfo.color + '14', color: statusInfo.color }">
        <view class="tc-status-dot" :style="{ backgroundColor: statusInfo.color }"></view>
        <text>{{ statusInfo.text }}</text>
      </view>
    </view>

    <view v-if="priorityInfo || task.is_urged" class="tc-flags">
      <text
        v-if="priorityInfo"
        class="tc-flag"
        :style="{ color: priorityInfo.color, backgroundColor: priorityInfo.color + '14' }"
      >{{ priorityInfo.label }}</text>
      <text v-if="task.is_urged" class="tc-flag tc-flag--urge">已被催办</text>
    </view>

    <view class="tc-foot">
      <view class="tc-people">
        <view class="tc-avatar">
          <text class="tc-avatar-text">{{ executorNames.charAt(0) }}</text>
        </view>
        <text class="tc-name">{{ executorNames }}</text>
        <text class="tc-from">由 {{ task.assign_user_name || '-' }} 发布</text>
      </view>
      <text class="tc-time" :class="{ 'is-due': isDueSoon }">{{ timeText }}</text>
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

const DONE_STATUSES = [5, 8]

const statusInfo = computed(() => TaskStatusMap[props.task.status] || { text: '未知', color: '#94A3B8' })

const executorNames = computed(() => {
  const names = props.task.executors?.map(e => e.nickname).filter(Boolean) || []
  return names.length > 0 ? names.join('、') : '未指派'
})

const priorityInfo = computed(() => {
  if (!props.task.priority) return null
  return PRIORITY_OPTIONS.find(p => p.value === props.task.priority) || null
})

const timeText = computed(() => {
  if (props.task.deadline) return `截止 ${formatDate(props.task.deadline, 'MM-DD HH:mm')}`
  return formatDate(props.task.create_time, 'MM-DD HH:mm')
})

const isDueSoon = computed(() => {
  if (!props.task.deadline || DONE_STATUSES.includes(props.task.status)) return false
  const diff = new Date(props.task.deadline.replace(/-/g, '/')).getTime() - Date.now()
  return diff < 24 * 60 * 60 * 1000
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.task-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 28rpx $space-4;
  border: 1rpx solid $border-light;
  box-shadow: $shadow-sm;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  transition: $transition-fast;

  &:active {
    background: $bg-subtle;
  }
}

.tc-head {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
}

.tc-title {
  flex: 1;
  min-width: 0;
  font-size: $font-base;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.tc-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
  height: 40rpx;
  padding: 0 14rpx;
  border-radius: $radius-xs;
  font-size: 22rpx;
  font-weight: 600;

  &-dot {
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
  }
}

.tc-flags {
  display: flex;
  gap: 12rpx;
}

.tc-flag {
  height: 36rpx;
  line-height: 36rpx;
  padding: 0 12rpx;
  border-radius: $radius-xs;
  font-size: 20rpx;
  font-weight: 600;

  &--urge {
    background: $accent-lemon-soft;
    color: $accent-lemon-text;
  }
}

.tc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding-top: 16rpx;
  border-top: 1rpx solid $border-light;
}

.tc-people {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.tc-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: $primary-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &-text {
    font-size: 20rpx;
    font-weight: 600;
    color: $primary;
  }
}

.tc-name {
  font-size: $font-xs;
  font-weight: 500;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240rpx;
}

.tc-from {
  font-size: 22rpx;
  color: $text-hint;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tc-time {
  flex-shrink: 0;
  font-size: 22rpx;
  color: $text-hint;
  font-variant-numeric: tabular-nums;

  &.is-due {
    color: $danger;
    font-weight: 600;
  }
}
</style>

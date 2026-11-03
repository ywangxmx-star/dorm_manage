<template>
  <view class="task-card" @click="$emit('click')">
    <view class="card-top">
      <view class="card-top-left">
        <text class="card-title" :style="{ color: titleColor }">{{ task.title }}</text>
        <text class="card-time">{{ formatDate(task.create_time, 'MM-DD HH:mm') }}</text>
      </view>
      <view class="card-top-right">
        <view v-if="task.is_urged" class="urge-tag">催办</view>
        <view class="status-tag" :style="{ backgroundColor: statusInfo.color + '14', color: statusInfo.color }">
          {{ statusInfo.text }}
        </view>
      </view>
    </view>
    <view class="card-bottom">
      <view class="user-item">
        <text class="user-label">发起</text>
        <text class="user-name">{{ task.assign_user_name || '-' }}</text>
      </view>
      <view class="user-divider"></view>
      <view class="user-item">
        <text class="user-label">执行</text>
        <text class="user-name">{{ executorNames }}</text>
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
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: $space-4;
  margin-bottom: $space-2;
  box-shadow: $shadow-card;
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
    background: $primary;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  &:active {
    transform: scale(0.98);
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $space-3;
}

.card-top-left {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
  min-width: 0;
  margin-right: $space-3;
}

.card-title {
  font-size: $font-base;
  font-weight: 600;
  line-height: 1.3;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-time {
  font-size: $font-xs;
  color: $text-hint;
  font-weight: 400;
}

.card-top-right {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-shrink: 0;
}

.urge-tag {
  font-size: 20rpx;
  padding: 4rpx $space-2;
  border-radius: $radius-full;
  background-color: rgba($warning, 0.1);
  color: $warning;
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
  line-height: 1.4;
}

.status-tag {
  font-size: 20rpx;
  padding: 4rpx $space-2;
  border-radius: $radius-full;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
  line-height: 1.4;
}

.card-bottom {
  display: flex;
  align-items: center;
  padding-top: $space-3;
  border-top: 1rpx solid $border-light;
}

.user-item {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex: 1;
  min-width: 0;
}

.user-label {
  font-size: 20rpx;
  color: $text-hint;
  background-color: $bg-hover;
  padding: 4rpx $space-2;
  border-radius: $radius-sm;
  flex-shrink: 0;
  line-height: 1.4;
}

.user-name {
  font-size: $font-xs;
  color: $text-secondary;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-divider {
  width: 2rpx;
  height: 24rpx;
  background-color: $border-light;
  flex-shrink: 0;
  margin: 0 $space-3;
}
</style>

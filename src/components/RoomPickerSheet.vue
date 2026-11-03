<template>
  <view v-if="modelValue" class="room-picker-mask" @click="close">
    <view class="room-picker" @click.stop>
      <view class="room-picker-handle"></view>
      <view class="room-picker-head">
        <text class="room-picker-head-title">{{ title }}</text>
        <view class="room-picker-head-close" @click="close">
          <image class="room-picker-head-close-icon" src="/static/icons/x.png" mode="aspectFit" />
        </view>
      </view>
      <scroll-view scroll-y class="room-picker-list">
        <view class="room-picker-list-inner">
          <view
            v-for="room in rooms"
            :key="room.id"
            class="room-picker-item"
            :class="{ 'is-active': room.id === currentRoomId }"
            @click="onSelect(room)"
          >
            <view class="room-picker-item-avatar">
              <text class="room-picker-item-avatar-text">{{ room.room_name.charAt(0) }}</text>
            </view>
            <view class="room-picker-item-info">
              <text class="room-picker-item-name">{{ room.room_name }}</text>
              <text class="room-picker-item-meta">{{ room.member_count }} 位成员</text>
            </view>
            <view v-if="room.id === currentRoomId" class="room-picker-item-check">
              <text class="room-picker-item-check-icon">✓</text>
            </view>
          </view>
        </view>
      </scroll-view>
      <view v-if="showFooter" class="room-picker-actions">
        <view class="room-picker-btn" @click="emit('create')">创建宿舍</view>
        <view class="room-picker-btn room-picker-btn--primary" @click="emit('join')">加入宿舍</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Room } from '@/types/room'

withDefaults(
  defineProps<{
    modelValue: boolean
    rooms: Room[]
    currentRoomId?: number
    title?: string
    showFooter?: boolean
  }>(),
  {
    title: '切换宿舍',
    showFooter: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [room: Room]
  create: []
  join: []
}>()

function close() {
  emit('update:modelValue', false)
}

function onSelect(room: Room) {
  emit('select', room)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.room-picker-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  backdrop-filter: blur(4rpx);
}

.room-picker {
  width: 100%;
  background: $bg-card;
  border-radius: $radius-xl $radius-xl 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: roomPickerSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.room-picker-handle {
  width: 48rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: $border-color;
  margin: $space-3 auto 0;
  flex-shrink: 0;
}

.room-picker-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4 $space-5 $space-3;
  flex-shrink: 0;

  &-title {
    font-size: $font-md;
    font-weight: 700;
    color: $text-primary;
  }

  &-close {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: $bg-hover;
    transition: $transition-fast;

    &:active {
      background: $border-color;
    }
  }

  &-close-icon {
    width: 24rpx;
    height: 24rpx;
  }
}

.room-picker-list {
  flex: 1;
  max-height: 55vh;
  width: 100%;
  box-sizing: border-box;
}

.room-picker-list-inner {
  padding: 0 $space-5;
  box-sizing: border-box;
}

.room-picker-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border-radius: $radius-lg;
  transition: $transition-fast;
  margin-bottom: $space-3;
  border: 1rpx solid $border-light;
  background: $bg-card;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;

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

  &:last-child {
    margin-bottom: 0;
  }

  &:active {
    transform: scale(0.98);
    border-color: $primary;
  }

  &.is-active {
    border-color: $primary;

    .room-picker-item-name {
      color: $primary;
    }

    &::before {
      opacity: 0.6;
    }
  }
}

.room-picker-item-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: $radius-lg;
  background: $primary-gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &-text {
    font-size: 28rpx;
    font-weight: 700;
    color: #fff;
  }
}

.room-picker-item-info {
  flex: 1;
  min-width: 0;
}

.room-picker-item-name {
  font-size: $font-base;
  font-weight: 600;
  color: $text-primary;
  display: block;
  margin-bottom: 4rpx;
}

.room-picker-item-meta {
  font-size: 22rpx;
  color: $text-hint;
}

.room-picker-item-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: $primary-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.room-picker-item-check-icon {
  font-size: 22rpx;
  color: $primary;
  font-weight: 700;
  line-height: 1;
}

.room-picker-actions {
  display: flex;
  gap: $space-3;
  padding: $space-4 $space-5 calc($space-6 + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.room-picker-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  font-size: $font-base;
  font-weight: 600;
  border: 2rpx solid $border-color;
  color: $text-primary;
  transition: $transition-fast;

  &:active {
    transform: scale(0.97);
  }

  &--primary {
    background: $primary-gradient;
    border-color: transparent;
    color: #fff;
    box-shadow: 0 8rpx 24rpx rgba($primary, 0.3);
  }
}

@keyframes roomPickerSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>

<template>
  <view class="empty-state fade-in">
    <view class="empty-icon-wrap">
      <image v-if="icon" :src="icon" class="empty-icon-img" />
      <text v-else class="empty-icon-text">{{ defaultIcon }}</text>
    </view>
    <text v-if="title" class="empty-title">{{ title }}</text>
    <text class="empty-text">{{ text }}</text>
    <view v-if="actionText" class="empty-action">
      <view class="btn-outline" @click="$emit('action')">
        <text>{{ actionText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title?: string
  text: string
  actionText?: string
  defaultIcon?: string
}>()

defineEmits(['action'])
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-12 $space-8;

  .empty-icon-wrap {
    width: 112rpx;
    height: 112rpx;
    margin-bottom: $space-4;
    background: $bg-hover;
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;

    .empty-icon-img {
      width: 52rpx;
      height: 52rpx;
      opacity: 0.45;
    }

    .empty-icon-text {
      font-size: 48rpx;
      color: $text-hint;
    }
  }

  .empty-title {
    font-size: $font-base;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $space-1;
  }

  .empty-text {
    font-size: $font-sm;
    color: $text-hint;
    text-align: center;
    line-height: 1.6;
  }

  .empty-action {
    margin-top: $space-5;
  }
}
</style>

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
  padding: $space-16 $space-10;

  .empty-icon-wrap {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: $space-7;
    background: linear-gradient(135deg, rgba($primary, 0.08), rgba($primary-light, 0.04));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    .empty-icon-img {
      width: 72rpx;
      height: 72rpx;
      opacity: 0.4;
    }

    .empty-icon-text {
      font-size: 72rpx;
      opacity: 0.3;
    }
  }

  .empty-title {
    font-size: $font-md;
    font-weight: 600;
    color: $text-secondary;
    margin-bottom: $space-2;
  }

  .empty-text {
    font-size: $font-sm;
    color: $text-hint;
    text-align: center;
    line-height: 1.6;
  }

  .empty-action {
    margin-top: $space-7;
  }
}
</style>

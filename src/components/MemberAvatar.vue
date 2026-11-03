<template>
  <view class="member-avatar" :class="{ 'show-name': showName }">
    <image v-if="avatar" :src="avatar" class="avatar-img" mode="aspectFill" />
    <view v-else class="avatar-placeholder">
      <text>{{ nicknameFirst }}</text>
    </view>
    <text v-if="showName" class="member-name">{{ nickname }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  avatar?: string
  nickname: string
  showName?: boolean
}>()

const nicknameFirst = computed(() => props.nickname ? props.nickname.charAt(0) : '?')
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.member-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;

  .avatar-img {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    border: 2rpx solid $border-light;
    box-shadow: $shadow-sm;
  }

  .avatar-placeholder {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary-light, $primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-white;
    font-size: $font-md;
    font-weight: 600;
    box-shadow: $shadow-sm;
  }

  .member-name {
    font-size: $font-sm;
    color: $text-secondary;
    margin-top: $space-2;
    max-width: 120rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }

  &.show-name {
    gap: $space-1;
  }
}
</style>

<template>
  <view class="page-loading">
    <view class="loading-spinner spinner-lg"></view>
    <text class="page-loading-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
  }>(),
  {
    text: '加载中...',
  },
)
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-4;
  min-height: 50vh;
  padding: $space-10 0;
}

.page-loading-text {
  font-size: $font-sm;
  color: $text-hint;
}
</style>

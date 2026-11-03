<template>
  <view class="form-section">
    <view class="form-label" v-if="label">
      <text>{{ label }}</text>
      <text v-if="required" class="required">*</text>
    </view>
    <slot />
    <text v-if="description" class="form-desc">{{ description }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  required?: boolean
  description?: string
}>()
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.form-section {
  margin-bottom: $space-7;

  .form-label {
    font-size: $font-sm;
    color: $text-secondary;
    margin-bottom: $space-3;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: $space-2;

    .required {
      color: $danger;
    }
  }

  .form-desc {
    font-size: $font-xs;
    color: $text-secondary;
    margin-top: $space-2;
    line-height: 1.6;
  }
}
</style>

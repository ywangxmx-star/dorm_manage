<template>
  <view class="compare-page" v-if="order">
    <view class="ui-header">
      <text class="ui-header__eyebrow">COMPARE · 差异对照</text>
      <view class="ui-header__row">
        <text class="ui-header__title">退租单 #{{ order.id }}</text>
      </view>
      <text class="ui-header__sub">与入住验房结果逐项对照</text>
    </view>

    <view class="list-wrap">
      <view v-for="item in order.items" :key="item.item_key" class="diff-card" :class="{ 'is-damage': item.diff_type === 'new_damage' }">
        <view class="diff-card__row">
          <text class="diff-card__title">{{ item.title }}</text>
          <text v-if="item.diff_type === 'new_damage'" class="tag tag-danger">新增缺损</text>
          <text v-else-if="item.diff_type === 'legacy'" class="tag tag-warning">遗留问题</text>
          <text v-else-if="item.diff_type === 'need_repair'" class="tag tag-warning">待修</text>
          <text v-else class="tag tag-success">无差异</text>
        </view>
        <view class="diff-card__row diff-card__row--sub">
          <text>入住：{{ resultLabel(item.checkin_result) }}</text>
          <text>退租：{{ resultLabel(item.checkout_result) }}</text>
        </view>
        <view class="diff-card__row diff-card__row--sub" v-if="item.checkin_meter_value || item.checkout_meter_value">
          <text>入住读数：{{ item.checkin_meter_value || '-' }}</text>
          <text>退租读数：{{ item.checkout_meter_value || '-' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getCheckoutDetail } from '@/api/tenancy'
import type { CheckoutOrderDetail } from '@/types/tenancy'

const order = ref<CheckoutOrderDetail | null>(null)

onLoad(async (query) => {
  const id = Number(query?.id || 0)
  const res = await getCheckoutDetail(id)
  order.value = res.data
})

function resultLabel(r: number | null) {
  if (r === null) return '-'
  return ({ 0: '正常', 1: '破损', 2: '缺失', 3: '待修' } as Record<number, string>)[r] || ''
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.compare-page {
  min-height: 100vh;
  padding-bottom: $space-16;
}

.list-wrap {
  padding: 0 $space-5;
}

.diff-card {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  padding: $space-4;
  margin-bottom: $space-3;

  &.is-damage {
    border-left: 8rpx solid $danger;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-3;

    &--sub {
      margin-top: $space-2;
      font-size: $font-xs;
      color: $text-hint;
    }
  }

  &__title {
    font-size: $font-base;
    font-weight: 700;
    color: $text-primary;
  }
}
</style>

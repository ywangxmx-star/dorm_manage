<template>
  <view class="bill-card" @click="$emit('click')">
    <view class="bc-main">
      <view class="bc-badge" :class="{ 'is-settled': bill.is_settled }">
        <text class="bc-badge-text">{{ billTypeText.charAt(0) }}</text>
      </view>
      <view class="bc-info">
        <text class="bc-title">{{ bill.title }}</text>
        <view class="bc-meta">
          <text>{{ billTypeText }}</text>
          <text class="bc-meta-dot">·</text>
          <text>{{ formatDate(bill.create_time, 'MM-DD HH:mm') }}</text>
        </view>
      </view>
      <view class="bc-amount-wrap">
        <text class="bc-amount">{{ formatAmount(bill.amount) }}</text>
        <text class="bc-settle" :class="{ 'is-settled': bill.is_settled }">{{ bill.is_settled ? '已结清' : '未结清' }}</text>
      </view>
    </view>
    <view v-if="myPayInfo" class="bc-mine">
      <text class="bc-mine-label">{{ myPayInfo.isPaid ? '我已付清' : '我的分摊' }}</text>
      <text class="bc-mine-amount" :class="{ 'is-paid': myPayInfo.isPaid }">{{ formatAmount(myPayInfo.amount) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Bill } from '@/types/bill'
import { BillTypeMap } from '@/types/bill'
import { formatDate } from '@/utils/date'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  bill: Bill
}>()

defineEmits(['click'])

const billTypeText = computed(() => BillTypeMap[props.bill.bill_type] || '其他')

const myPayInfo = computed(() => {
  if (props.bill.my_should_pay === undefined || props.bill.my_should_pay === null) {
    return null
  }
  return {
    amount: props.bill.my_should_pay,
    isPaid: props.bill.my_pay_status === 2,
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.bill-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 28rpx $space-4;
  border: 1rpx solid $border-light;
  box-shadow: $shadow-sm;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  transition: $transition-fast;

  &:active {
    background: $bg-subtle;
  }
}

.bc-main {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.bc-badge {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius-md;
  background: $primary-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.is-settled {
    background: $bg-hover;
  }

  &-text {
    font-size: $font-sm;
    font-weight: 600;
    color: $primary;
  }

  &.is-settled &-text {
    color: $text-hint;
  }
}

.bc-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.bc-title {
  font-size: $font-base;
  font-weight: 600;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bc-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: $text-hint;

  &-dot {
    color: $border-color;
  }
}

.bc-amount-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
  flex-shrink: 0;
}

.bc-amount {
  font-family: $font-num;
  font-size: $font-md;
  font-weight: 700;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
}

.bc-settle {
  font-size: 22rpx;
  font-weight: 500;
  color: $warning;

  &.is-settled {
    color: $text-hint;
  }
}

.bc-mine {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
  border-top: 1rpx solid $border-light;

  &-label {
    font-size: $font-xs;
    color: $text-secondary;
  }

  &-amount {
    font-family: $font-num;
    font-size: $font-sm;
    font-weight: 700;
    color: $primary;
    font-variant-numeric: tabular-nums;

    &.is-paid {
      color: $success;
    }
  }
}
</style>

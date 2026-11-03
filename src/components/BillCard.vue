<template>
  <view class="bill-card" @click="$emit('click')">
    <view class="bc-main">
      <view class="bc-badge" :class="{ 'is-settled': bill.is_settled }">
        <text class="bc-badge-text">{{ billTypeText.charAt(0) }}</text>
      </view>
      <view class="bc-info">
        <text class="bc-title">{{ bill.title }}</text>
        <text class="bc-meta">{{ billTypeText }} · {{ formatDate(bill.create_time, 'MM-DD HH:mm') }}</text>
      </view>
      <view class="bc-amount-wrap">
        <text class="bc-amount">{{ formatAmount(bill.amount) }}</text>
        <text class="bc-settle" :class="{ 'is-settled': bill.is_settled }">{{ bill.is_settled ? '已结清' : '未结清' }}</text>
      </view>
    </view>
    <view v-if="myPayInfo" class="bc-mine" :class="{ 'is-paid': myPayInfo.isPaid }">
      <text class="bc-mine-label">{{ myPayInfo.isPaid ? '我已付清' : '我需分摊' }}</text>
      <text class="bc-mine-amount">{{ formatAmount(myPayInfo.amount) }}</text>
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
  padding: $space-4;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  transition: $transition-fast;

  &:active {
    transform: scale(0.98);
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
  border-radius: 26rpx;
  background: $accent-lemon;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transform: rotate(-4deg);

  &.is-settled {
    background: $success-bg;
  }

  &-text {
    font-size: $font-md;
    font-weight: 900;
    color: $text-primary;
  }
}

.bc-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.bc-title {
  font-size: $font-base;
  font-weight: 800;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bc-meta {
  font-size: $font-xs;
  color: $text-hint;
}

.bc-amount-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
  flex-shrink: 0;
}

.bc-amount {
  font-size: $font-md;
  font-weight: 900;
  color: $text-primary;
  letter-spacing: -0.02em;
}

.bc-settle {
  font-size: 22rpx;
  font-weight: 700;
  color: $warning;

  &.is-settled {
    color: $success;
  }
}

.bc-mine {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 20rpx;
  border-radius: $radius-md;
  background: $primary-bg;

  &.is-paid {
    background: $success-bg;
  }

  &-label {
    font-size: $font-xs;
    font-weight: 600;
    color: $text-secondary;
  }

  &-amount {
    font-size: $font-sm;
    font-weight: 800;
    color: $primary;
  }
}

.bc-mine.is-paid .bc-mine-amount {
  color: $success;
}
</style>

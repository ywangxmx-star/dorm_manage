<template>
  <view class="bill-card" @click="$emit('click')">
    <view class="bill-body">
      <view class="bill-left">
        <text class="bill-title">{{ bill.title }}</text>
        <view class="bill-meta">
          <text class="meta-text">{{ billTypeText }}</text>
          <text class="meta-dot">-</text>
          <text class="meta-text">{{ formatDate(bill.create_time, 'MM-DD HH:mm') }}</text>
        </view>
        <view v-if="myPayInfo" class="my-pay-info">
          <text class="my-pay-label">我的分摊</text>
          <text class="my-pay-amount" :class="{ 'is-paid': myPayInfo.isPaid }">{{ formatAmount(myPayInfo.amount) }}</text>
        </view>
      </view>
      <view class="bill-right">
        <view class="settle-tag" :class="{ settled: bill.is_settled }">
          {{ bill.is_settled ? '已结清' : '未结清' }}
        </view>
        <text class="bill-amount">{{ formatAmount(bill.amount) }}</text>
      </view>
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
    background: $success;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-sm;
  }

  .bill-body {
    display: flex;
    justify-content: space-between;

    .bill-left {
      flex: 1;
      margin-right: $space-4;
      display: flex;
      flex-direction: column;
      gap: $space-2;

      .bill-title {
        font-size: $font-base;
        font-weight: 600;
        color: $text-primary;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }

      .bill-meta {
        display: flex;
        align-items: center;
        gap: $space-2;

        .meta-text {
          font-size: $font-xs;
          color: $text-secondary;
        }

        .meta-dot {
          font-size: $font-xs;
          color: $border-color;
        }
      }

      .my-pay-info {
        display: flex;
        align-items: center;
        gap: $space-2;
        padding-top: $space-2;
        border-top: 1rpx solid $border-light;

        .my-pay-label {
          font-size: $font-xs;
          color: $text-hint;
        }

        .my-pay-amount {
          font-size: $font-sm;
          font-weight: 600;
          color: $warning;

          &.is-paid {
            color: $success;
          }
        }
      }
    }

    .bill-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: $space-2;

      .settle-tag {
        font-size: 20rpx;
        padding: 4rpx $space-3;
        border-radius: $radius-full;
        background-color: $warning-bg;
        color: $warning;
        font-weight: 500;
        flex-shrink: 0;

        &.settled {
          background-color: $success-bg;
          color: $success;
        }
      }

      .bill-amount {
        font-size: $font-lg;
        font-weight: 700;
        color: $text-primary;
        line-height: 1;
      }
    }
  }
}
</style>

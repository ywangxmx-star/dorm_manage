<template>
  <view class="bill-detail-page" v-if="bill">
    <view class="receipt">
      <view class="receipt-head">
        <text class="receipt-type">{{ billTypeText }} · {{ splitTypeText }}</text>
        <view class="receipt-stamp" :class="{ 'is-settled': bill.is_settled }">
          <text>{{ bill.is_settled ? '已结清' : '收款中' }}</text>
        </view>
      </view>
      <text class="receipt-title">{{ bill.title }}</text>
      <view class="receipt-amount">
        <text class="receipt-amount-lbl">总金额</text>
        <text class="receipt-amount-num">{{ formatAmount(bill.amount) }}</text>
      </view>

      <view class="receipt-cut"></view>

      <view class="mine-row" :class="{ 'is-settled': mySplitSettled }">
        <view class="mine-row-left">
          <text class="mine-row-lbl">我要付</text>
          <text class="mine-row-num">{{ formatAmount(mySplitAmount) }}</text>
        </view>
        <text class="mine-row-tag">{{ mySplitSettled ? '我已结清' : '我未结清' }}</text>
      </view>

      <view class="progress">
        <view class="progress-top">
          <text class="progress-lbl">收款进度 {{ paidCount }}/{{ bill.splits.length }}</text>
          <text class="progress-lbl">已收 {{ formatAmount(totalPaid) }} · 待收 {{ formatAmount(totalUnpaid) }}</text>
        </view>
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: (bill.splits.length ? paidCount / bill.splits.length * 100 : 0) + '%' }"></view>
        </view>
      </view>
    </view>

    <text class="ui-form-label">账单信息</text>
    <view class="ui-form-group">
      <view class="kv">
        <text class="kv-k">消费类型</text>
        <text class="kv-v">{{ billTypeText }}</text>
      </view>
      <view class="kv">
        <text class="kv-k">分摊方式</text>
        <text class="kv-v">{{ splitTypeText }}</text>
      </view>
      <view class="kv" v-if="bill.remark">
        <text class="kv-k">备注</text>
        <text class="kv-v">{{ bill.remark }}</text>
      </view>
      <view class="kv">
        <text class="kv-k">创建时间</text>
        <text class="kv-v">{{ formatTime(bill.create_time) }}</text>
      </view>
    </view>

    <text class="ui-form-label">谁付了多少</text>
    <view class="split-list">
      <view class="split" v-for="split in bill.splits" :key="split.id" :class="{ 'is-paid': split.pay_status === 2 }">
        <view class="split-avatar">
          <text class="split-avatar-text">{{ (split.nickname || '用').charAt(0) }}</text>
        </view>
        <view class="split-info">
          <view class="split-name-row">
            <text class="split-name">{{ split.nickname || `用户 #${split.user_id}` }}</text>
            <text v-if="split.user_id === bill.creator_id" class="split-creator">发起人</text>
          </view>
          <text class="split-amount">应付 {{ formatAmount(split.should_pay) }}</text>
        </view>
        <view v-if="split.pay_status === 2" class="split-tag split-tag--paid">已付</view>
        <view v-else-if="split.user_id === currentUserId" class="split-pay" @click="handlePay">去支付</view>
        <view v-else class="split-tag split-tag--wait">未付</view>
      </view>
    </view>

    <view class="delete-section" v-if="isLeader">
      <view class="delete-btn" @click="handleDelete">删除这笔账单</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { getBillDetail, payBill, deleteBill } from '@/api/bill'
import { BillTypeMap, SplitTypeMap } from '@/types/bill'
import { formatAmount } from '@/utils/format'
import type { BillWithSplits } from '@/types/bill'

const authStore = useAuthStore()
const roomStore = useRoomStore()
const bill = ref<BillWithSplits | null>(null)
let billId = 0

const currentUserId = computed(() => authStore.userInfo?.id)
const isLeader = computed(() => roomStore.currentRoom?.owner_id === authStore.userInfo?.id)
const billTypeText = computed(() => BillTypeMap[bill.value?.bill_type || 0] || '其他')
const splitTypeText = computed(() => SplitTypeMap[bill.value?.split_type || 0] || 'AA均分')

const paidCount = computed(() => {
  if (!bill.value?.splits) return 0
  return bill.value.splits.filter(s => s.pay_status === 2).length
})

const mySplitAmount = computed(() => {
  if (!bill.value?.splits || !currentUserId.value) return 0
  const mySplit = bill.value.splits.find(s => s.user_id === currentUserId.value)
  return mySplit ? Number(mySplit.should_pay) : 0
})

const mySplitSettled = computed(() => {
  if (!bill.value?.splits || !currentUserId.value) return false
  const mySplit = bill.value.splits.find(s => s.user_id === currentUserId.value)
  return mySplit ? mySplit.pay_status === 2 : false
})

const totalPaid = computed(() => {
  if (!bill.value?.splits) return 0
  return bill.value.splits.reduce((sum, s) => {
    if (s.pay_status === 2) {
      return sum + (Number(s.should_pay) || 0)
    }
    return sum
  }, 0)
})

const totalUnpaid = computed(() => {
  if (!bill.value?.splits) return 0
  return bill.value.splits.reduce((sum, s) => {
    if (s.pay_status !== 2) {
      return sum + (Number(s.should_pay) || 0)
    }
    return sum
  }, 0)
})

onLoad((options) => { billId = Number(options?.id) })

onShow(async () => {
  if (billId) {
    const res = await getBillDetail(billId)
    bill.value = res.data
  }
})

function formatTime(time: string) {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

async function handlePay() {
  try {
    await payBill(billId)
    uni.showToast({ title: '支付成功', icon: 'success' })
    const res = await getBillDetail(billId)
    bill.value = res.data
  } catch { /* handled */ }
}

async function handleDelete() {
  uni.showModal({
    title: '删除账单',
    content: '确定删除该账单吗？删除后可在"最近删除"中恢复，7天后将自动清除。',
    success: async (res) => {
      if (res.confirm) {
        await deleteBill(billId)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    },
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.bill-detail-page {
  min-height: 100vh;
  background: $bg-page;
  padding: $space-4 0 calc(env(safe-area-inset-bottom) + 60rpx);
}

/* 小票 */
.receipt {
  margin: 0 $space-5;
  padding: $space-5;
  background: $bg-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &-type {
    font-size: $font-xs;
    font-weight: 700;
    color: $primary;
    padding: 8rpx 20rpx;
    background: $primary-bg;
    border-radius: $radius-full;
  }

  &-stamp {
    padding: 8rpx 20rpx;
    border: 3rpx solid $warning;
    border-radius: $radius-sm;
    color: $warning;
    font-size: $font-xs;
    font-weight: 900;
    transform: rotate(6deg);

    &.is-settled {
      border-color: $success;
      color: $success;
    }
  }

  &-title {
    font-size: 44rpx;
    font-weight: 900;
    color: $text-primary;
    line-height: 1.3;
  }

  &-amount {
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    &-lbl {
      font-size: $font-xs;
      color: $text-hint;
    }

    &-num {
      font-size: 80rpx;
      font-weight: 900;
      color: $text-primary;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
  }

  &-cut {
    height: 0;
    border-top: 3rpx dashed $border-color;
    margin: $space-1 0;
  }
}

.mine-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  background: $accent-lemon;
  border-radius: $radius-lg;

  &.is-settled {
    background: $success-bg;
  }

  &-left {
    display: flex;
    align-items: baseline;
    gap: $space-2;
  }

  &-lbl {
    font-size: $font-xs;
    font-weight: 700;
    color: $text-primary;
  }

  &-num {
    font-size: $font-xl;
    font-weight: 900;
    color: $text-primary;
  }

  &-tag {
    font-size: $font-xs;
    font-weight: 700;
    color: $text-primary;
  }
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  &-top {
    display: flex;
    justify-content: space-between;
    gap: $space-2;
  }

  &-lbl {
    font-size: 22rpx;
    color: $text-secondary;
  }

  &-track {
    height: 16rpx;
    background: $border-light;
    border-radius: $radius-full;
    overflow: hidden;
  }

  &-fill {
    height: 100%;
    background: $success;
    border-radius: $radius-full;
    transition: width 0.4s ease;
  }
}

/* 信息 */
.kv {
  display: flex;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-3 0;
  border-bottom: 2rpx dashed $border-color;

  &:last-child {
    border-bottom: none;
  }

  &-k {
    flex-shrink: 0;
    font-size: $font-sm;
    color: $text-secondary;
  }

  &-v {
    font-size: $font-sm;
    font-weight: 700;
    color: $text-primary;
    text-align: right;
    word-break: break-all;
  }
}

/* 分摊 */
.split-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: 0 $space-5;
}

.split {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;

  &.is-paid {
    opacity: 0.75;
  }
}

.split-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &-text {
    font-size: $font-sm;
    font-weight: 800;
    color: $text-white;
  }
}

.split-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.split-name-row {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.split-name {
  font-size: $font-sm;
  font-weight: 700;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.split-creator {
  padding: 2rpx 12rpx;
  border-radius: $radius-full;
  background: $primary-bg;
  color: $primary;
  font-size: 20rpx;
  font-weight: 700;
}

.split-amount {
  font-size: $font-xs;
  color: $text-secondary;
}

.split-tag {
  flex-shrink: 0;
  padding: 8rpx 20rpx;
  border-radius: $radius-full;
  font-size: $font-xs;
  font-weight: 700;

  &--paid {
    background: $success-bg;
    color: $success;
  }

  &--wait {
    background: $warning-bg;
    color: $warning;
  }
}

.split-pay {
  flex-shrink: 0;
  padding: 14rpx 32rpx;
  border-radius: $radius-full;
  background: $primary;
  color: $text-white;
  font-size: $font-xs;
  font-weight: 800;
  box-shadow: $shadow-primary;
}

.delete-section {
  padding: $space-6 $space-5 0;
}

.delete-btn {
  text-align: center;
  padding: $space-3 0;
  font-size: $font-sm;
  font-weight: 700;
  color: $danger;
}
</style>

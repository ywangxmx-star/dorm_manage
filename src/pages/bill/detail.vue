<template>
  <view class="detail-page" v-if="bill">
    <view class="ui-panel summary">
      <view class="summary-top">
        <text class="summary-type">{{ billTypeText }} · {{ splitTypeText }}</text>
        <view class="state-tag" :class="bill.is_settled ? 'state-tag--ok' : 'state-tag--wait'">
          <text>{{ bill.is_settled ? '已结清' : '收款中' }}</text>
        </view>
      </view>
      <text class="summary-title">{{ bill.title }}</text>
      <text class="summary-amount num">{{ formatAmount(bill.amount) }}</text>

      <view class="mine" :class="{ 'is-settled': mySplitSettled }">
        <view class="mine-left">
          <text class="mine-lbl">我要付</text>
          <text class="mine-num num">{{ formatAmount(mySplitAmount) }}</text>
        </view>
        <text class="mine-tag">{{ mySplitSettled ? '我已结清' : '我未结清' }}</text>
      </view>

      <view class="progress">
        <view class="progress-top">
          <text class="progress-lbl">收款进度 <text class="num">{{ paidCount }}/{{ bill.splits.length }}</text></text>
          <text class="progress-lbl num">已收 {{ formatAmount(totalPaid) }} · 待收 {{ formatAmount(totalUnpaid) }}</text>
        </view>
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: (bill.splits.length ? paidCount / bill.splits.length * 100 : 0) + '%' }"></view>
        </view>
      </view>
    </view>

    <text class="ui-form-label">账单信息</text>
    <view class="ui-form-group">
      <view class="ui-row">
        <text class="ui-row__label">消费类型</text>
        <text class="ui-row__value">{{ billTypeText }}</text>
      </view>
      <view class="ui-row">
        <text class="ui-row__label">分摊方式</text>
        <text class="ui-row__value">{{ splitTypeText }}</text>
      </view>
      <view class="ui-row" v-if="bill.remark">
        <text class="ui-row__label">备注</text>
        <text class="ui-row__value remark-val">{{ bill.remark }}</text>
      </view>
      <view class="ui-row">
        <text class="ui-row__label">创建时间</text>
        <text class="ui-row__value num">{{ formatTime(bill.create_time) }}</text>
      </view>
    </view>

    <text class="ui-form-label">谁付了多少</text>
    <view class="ui-form-group">
      <view class="split" v-for="split in bill.splits" :key="split.id">
        <view class="split-avatar" :class="{ 'is-paid': split.pay_status === 2 }">
          <text class="split-avatar-text">{{ (split.nickname || '用').charAt(0) }}</text>
        </view>
        <view class="split-info">
          <view class="split-name-row">
            <text class="split-name">{{ split.nickname || `用户 #${split.user_id}` }}</text>
            <text v-if="split.user_id === bill.creator_id" class="split-creator">发起人</text>
          </view>
          <text class="split-amount num">应付 {{ formatAmount(split.should_pay) }}</text>
        </view>
        <view v-if="split.pay_status === 2" class="split-tag split-tag--paid">已付</view>
        <view v-else-if="split.user_id === currentUserId" class="ui-btn ui-btn--primary ui-btn--sm split-pay" @click="handlePay">去支付</view>
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

.detail-page {
  min-height: 100vh;
  background: $bg-page;
  padding: $space-3 0 calc(#{$space-8} + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.summary {
  margin: 0 $page-gutter;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}

.summary-type {
  font-size: $font-xs;
  color: $text-secondary;
  line-height: 1.4;
}

.state-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: $radius-xs;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;

  &--ok { color: $success; background: $success-bg; }
  &--wait { color: $warning; background: $warning-bg; }
}

.summary-title {
  margin-top: $space-1;
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.4;
  word-break: break-all;
}

.summary-amount {
  font-size: $font-xl;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.2;
}

.mine {
  margin-top: $space-3;
  padding: $space-3;
  border-radius: $radius-md;
  background: $primary-bg;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;

  &-left {
    display: flex;
    align-items: baseline;
    gap: $space-2;
    min-width: 0;
  }

  &-lbl {
    font-size: $font-xs;
    color: $text-secondary;
  }

  &-num {
    font-size: $font-md;
    font-weight: 700;
    color: $primary;
  }

  &-tag {
    flex-shrink: 0;
    font-size: 22rpx;
    font-weight: 600;
    color: $primary;
  }

  &.is-settled {
    background: $success-bg;

    .mine-num,
    .mine-tag { color: $success; }
  }
}

.progress {
  margin-top: $space-3;
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8rpx $space-2;
  }

  &-lbl {
    font-size: 22rpx;
    color: $text-secondary;
    line-height: 1.4;
  }

  &-track {
    height: 10rpx;
    border-radius: $radius-full;
    background: $bg-hover;
    overflow: hidden;
  }

  &-fill {
    height: 100%;
    border-radius: $radius-full;
    background: $success;
    transition: width 0.3s ease;
  }
}

.remark-val {
  white-space: normal;
  word-break: break-all;
}

.split {
  display: flex;
  align-items: center;
  gap: $space-3;
  min-height: 112rpx;
  border-bottom: 1rpx solid $border-light;

  &:last-child { border-bottom: none; }
}

.split-avatar {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $bg-hover;
  display: flex;
  align-items: center;
  justify-content: center;

  &.is-paid { background: $success-bg; }

  &-text {
    font-size: $font-sm;
    font-weight: 600;
    line-height: 1;
    color: $text-secondary;
  }

  &.is-paid &-text { color: $success; }
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
  gap: $space-1;
  min-width: 0;
}

.split-name {
  font-size: $font-sm;
  font-weight: 500;
  color: $text-primary;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.split-creator {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 32rpx;
  padding: 0 10rpx;
  border-radius: 6rpx;
  background: $primary-bg;
  color: $primary;
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1;
}

.split-amount {
  font-size: $font-xs;
  color: $text-hint;
  line-height: 1.3;
}

.split-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: $radius-xs;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;

  &--paid { color: $success; background: $success-bg; }
  &--wait { color: $text-secondary; background: $bg-hover; }
}

.split-pay {
  flex: none;
  width: auto;
}

.delete-section {
  margin: $space-6 $page-gutter 0;
}

.delete-btn {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $bg-card;
  border: 1rpx solid $border-color;
  color: $danger;
  font-size: $font-sm;
  font-weight: 500;
  line-height: 1;

  &:active { background: $danger-bg; }
}
</style>

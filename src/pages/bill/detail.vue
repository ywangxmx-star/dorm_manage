<template>
  <view class="bill-detail-page" v-if="bill">
    <!-- 头部 -->
    <view class="hero-card section-card section-card-bill">
      <view class="hero-top">
        <view class="hero-top-left">
          <text class="bill-title">{{ bill.title }}</text>
          <view class="bill-meta">
            <text class="bill-meta-text">{{ billTypeText }} · {{ splitTypeText }}</text>
          </view>
        </view>
      </view>
      <view class="hero-amount-row">
        <view class="hero-amount-main">
          <text class="hero-amount-label">总金额</text>
          <text class="hero-amount-value">{{ formatAmount(bill.amount) }}</text>
        </view>
        <view class="hero-amount-divider"></view>
        <view class="hero-amount-main">
          <text class="hero-amount-label">我的分摊</text>
          <text class="hero-amount-value primary">{{ formatAmount(mySplitAmount) }}</text>
        </view>
      </view>
      <view class="hero-stats-row">
        <view class="hero-stat">
          <text class="hero-stat-label">已收</text>
          <text class="hero-stat-value success">{{ formatAmount(totalPaid) }}</text>
        </view>
        <view class="hero-stat-divider"></view>
        <view class="hero-stat">
          <text class="hero-stat-label">待收</text>
          <text class="hero-stat-value warning">{{ formatAmount(totalUnpaid) }}</text>
        </view>
        <view class="hero-stat-divider"></view>
        <view class="hero-stat">
          <text class="hero-stat-label">进度</text>
          <text class="hero-stat-value">{{ paidCount }}/{{ bill.splits.length }}</text>
        </view>
      </view>
      <view class="hero-tags">
        <view class="settle-tag" :class="{ settled: bill.is_settled }">
          <text class="settle-tag-dot" :class="{ settled: bill.is_settled }"></text>
          账单{{ bill.is_settled ? '已结清' : '未结清' }}
        </view>
        <view class="settle-tag" :class="{ settled: mySplitSettled }">
          <text class="settle-tag-dot" :class="{ settled: mySplitSettled }"></text>
          我的{{ mySplitSettled ? '已结清' : '未结清' }}
        </view>
      </view>
    </view>

    <!-- 信息 -->
    <view class="info-card card">
      <view class="info-row">
        <view class="info-icon-wrap">
          <image class="info-icon-img" src="/static/icons/expense-other.png" mode="aspectFit" />
        </view>
        <view class="info-content">
          <text class="info-label">消费类型</text>
          <text class="info-value">{{ billTypeText }}</text>
        </view>
      </view>
      <view class="info-row">
        <view class="info-icon-wrap">
          <image class="info-icon-img" src="/static/icons/users-sm.png" mode="aspectFit" />
        </view>
        <view class="info-content">
          <text class="info-label">分摊方式</text>
          <text class="info-value">{{ splitTypeText }}</text>
        </view>
      </view>
      <view class="info-row" v-if="bill.remark">
        <view class="info-icon-wrap">
          <image class="info-icon-img" src="/static/icons/task.png" mode="aspectFit" />
        </view>
        <view class="info-content">
          <text class="info-label">备注</text>
          <text class="info-value">{{ bill.remark }}</text>
        </view>
      </view>
      <view class="info-row">
        <view class="info-icon-wrap">
          <image class="info-icon-img" src="/static/icons/clock.png" mode="aspectFit" />
        </view>
        <view class="info-content">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatTime(bill.create_time) }}</text>
        </view>
      </view>
    </view>

    <!-- 分摊明细 -->
    <view class="section">
      <view class="section-header">
        <view class="section-header-left">
          <image class="section-header-icon" src="/static/icons/receipt.png" mode="aspectFit" />
          <text class="section-title">分摊明细</text>
        </view>
      </view>
      <view class="split-list">
        <view class="split-item card" v-for="split in bill.splits" :key="split.id">
          <view class="split-left">
            <view class="user-info">
              <text class="split-user">{{ split.nickname || `用户 #${split.user_id}` }}</text>
              <text v-if="split.user_id === bill.creator_id" class="creator-tag">创建者</text>
            </view>
            <text class="split-amount">应付 {{ formatAmount(split.should_pay) }}</text>
          </view>
          <view class="split-right">
            <view v-if="split.pay_status === 2" class="tag tag-success">已支付</view>
            <button v-else-if="split.user_id === currentUserId" class="btn-primary pay-btn" @click="handlePay">去支付</button>
            <view v-else class="tag tag-warning">未付</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 删除：仅宿舍长可见 -->
    <view class="delete-section" v-if="isLeader">
      <button class="delete-btn" @click="handleDelete">删除账单</button>
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
  padding: $space-3;
  padding-bottom: $space-6;
  min-height: 100vh;
  background: $bg-page;
}

.section-card-bill {
  background: $bg-card;
  border: 1rpx solid $border-color;
  position: relative;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.section-card-bill::before {
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

.hero-card {
  padding: $space-4 $space-4 $space-3;

  .hero-top {
    margin-bottom: $space-3;
  }

  .hero-top-left {
    .bill-title {
      font-size: $font-md;
      font-weight: 700;
      color: $text-primary;
      display: block;
      margin-bottom: $space-1;
    }

    .bill-meta {
      .bill-meta-text {
        font-size: $font-xs;
        color: $text-hint;
        font-weight: 500;
      }
    }
  }

  .hero-amount-row {
    display: flex;
    align-items: center;
    padding: $space-3 0;
    margin-bottom: $space-3;
    border-bottom: 1rpx solid $border-light;
  }

  .hero-amount-main {
    flex: 1;
    text-align: center;
  }

  .hero-amount-divider {
    width: 1rpx;
    height: 64rpx;
    background-color: $border-light;
    margin: 0 $space-3;
  }

  .hero-amount-label {
    font-size: $font-xs;
    color: $text-hint;
    display: block;
    margin-bottom: $space-1;
  }

  .hero-amount-value {
    font-size: $font-lg;
    font-weight: 800;
    color: $text-primary;
    letter-spacing: -0.02em;
    line-height: 1;

    &.primary {
      color: $primary;
    }
  }

  .hero-stats-row {
    display: flex;
    align-items: center;
    padding: $space-2 0;
    margin-bottom: $space-3;
    background: $bg-hover;
    border-radius: $radius-md;
    padding: $space-3;
  }

  .hero-stat {
    flex: 1;
    text-align: center;
  }

  .hero-stat-divider {
    width: 1rpx;
    height: 32rpx;
    background-color: $border-color;
  }

  .hero-stat-label {
    font-size: $font-xs;
    color: $text-hint;
    display: block;
    margin-bottom: 4rpx;
  }

  .hero-stat-value {
    font-size: $font-sm;
    font-weight: 700;
    color: $text-primary;

    &.success {
      color: $success;
    }

    &.warning {
      color: $warning;
    }
  }

  .hero-tags {
    display: flex;
    gap: $space-2;
  }

  .settle-tag {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-size: $font-xs;
    padding: $space-1 $space-3;
    border-radius: $radius-full;
    background-color: $warning-bg;
    color: $warning;
    font-weight: 600;

    &.settled {
      background-color: $success-bg;
      color: $success;
    }
  }

  .settle-tag-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background-color: $warning;

    &.settled {
      background-color: $success;
    }
  }
}

.info-card {
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-xl;
  padding: $space-4;
  box-shadow: $shadow-sm;

  .info-row {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-3 0;

    &:not(:last-child) {
      border-bottom: 1rpx solid $border-light;
    }

    .info-icon-wrap {
      width: 40rpx;
      height: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .info-icon-img {
        width: 28rpx;
        height: 28rpx;
      }
    }

    .info-content {
      flex: 1;

      .info-label {
        font-size: $font-xs;
        color: $text-hint;
        display: block;
        margin-bottom: 2rpx;
      }

      .info-value {
        font-size: $font-sm;
        color: $text-primary;
        font-weight: 500;
        display: block;
      }
    }
  }
}

.section {
  margin-top: $space-3;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-3;

    .section-header-left {
      display: flex;
      align-items: center;
      gap: $space-2;
    }

    .section-header-icon {
      width: 32rpx;
      height: 32rpx;
    }

    .section-title {
      font-size: $font-base;
      font-weight: 700;
      color: $text-primary;
      margin-bottom: 0;
    }

    .section-summary {
      font-size: $font-xs;
      color: $text-hint;
    }
  }
}

.split-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.split-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3 $space-4;
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
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

  .split-left {
    flex: 1;

    .user-info {
      display: flex;
      align-items: center;
      gap: $space-2;
      margin-bottom: $space-1;
    }

    .split-user {
      font-size: $font-sm;
      font-weight: 600;
      color: $text-primary;
    }

    .creator-tag {
      font-size: $font-xs;
      color: $primary;
      background-color: $primary-bg;
      padding: 2rpx $space-2;
      border-radius: $radius-sm;
    }

    .split-amount {
      font-size: $font-xs;
      color: $text-hint;
      display: block;
    }
  }

  .split-right {
    .pay-btn {
      font-size: $font-sm;
      padding: $space-2 $space-4;
    }
  }
}

.delete-section {
  margin-top: $space-4;

  .delete-btn {
    width: 100%;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-size: $font-sm;
    font-weight: 600;
    color: $danger;
    background-color: $bg-card;
    border: 1rpx solid rgba($danger, 0.2);
    border-radius: $radius-lg;
    transition: $transition-fast;
    box-shadow: $shadow-sm;

    &:active {
      background-color: rgba($danger, 0.04);
    }
  }
}
</style>

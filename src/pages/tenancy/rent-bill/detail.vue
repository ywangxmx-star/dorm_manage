<template>
  <view class="rent-detail-page" v-if="bill">
    <view class="ui-header">
      <text class="ui-header__eyebrow">RENT BILL · 账单详情</text>
      <view class="ui-header__row">
        <text class="ui-header__title">{{ bill.title }}</text>
      </view>
      <text class="ui-header__sub">
        {{ typeText }}
        <text v-if="bill.period_start"> · {{ bill.period_start }}{{ bill.period_end ? ' ~ ' + bill.period_end : '' }}</text>
      </text>
    </view>

    <view class="amount-card">
      <text class="amount-card__num">¥{{ bill.amount }}</text>
      <text class="tag" :class="bill.is_settled ? 'tag-success' : 'tag-warning'">{{ bill.is_settled ? '已结清' : '未结清' }}</text>
    </view>

    <text class="ui-form-label">分摊明细</text>
    <view class="ui-form-group">
      <view v-for="s in bill.splits" :key="s.id" class="ui-cell">
        <text class="ui-cell__label">{{ s.nickname || s.user_id }}</text>
        <view class="split-right">
          <text class="split-right__pay">¥{{ s.should_pay }}</text>
          <text class="tag" :class="s.pay_status === 2 ? 'tag-success' : 'tag-warning'">{{ s.pay_status === 2 ? '已支付' : '待支付' }}</text>
        </view>
      </view>
    </view>

    <template v-if="bill.images.length">
      <text class="ui-form-label">凭证</text>
      <view class="ui-form-group">
        <view class="img-grid">
          <image
            v-for="(img, idx) in bill.images" :key="idx"
            :src="img" mode="aspectFill" class="img-grid__img"
            @click="preview(idx)"
          />
        </view>
      </view>
    </template>

    <template v-if="bill.remark">
      <text class="ui-form-label">备注</text>
      <view class="ui-form-group">
        <view class="remark">{{ bill.remark }}</view>
      </view>
    </template>

    <view class="ui-bottom-spacer" />
    <view class="ui-bottom-bar">
      <button v-if="mySplit && mySplit.pay_status !== 2" class="ui-btn ui-btn--primary" @click="pay">我已支付</button>
      <button v-if="isManager && !bill.is_settled" class="ui-btn ui-btn--danger" @click="remove">作废账单</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getRentBillDetail, payRentBill, deleteRentBill } from '@/api/tenancy'
import { getMembers } from '@/api/room'
import { useAuthStore } from '@/stores/auth'
import type { RentBillWithSplits } from '@/types/tenancy'

const authStore = useAuthStore()
const roomId = ref(0)
const billId = ref(0)
const bill = ref<RentBillWithSplits | null>(null)
const isManager = ref(false)

const mySplit = computed(() =>
  bill.value?.splits.find(s => s.user_id === authStore.userInfo?.id)
)
const typeText = computed(() =>
  ({ 0: '租金', 1: '押金', 2: '中介费', 3: '物业费', 4: '维修分摊', 5: '其他' } as Record<number, string>)[bill.value?.rent_type ?? 0]
)

onLoad(async (query) => {
  roomId.value = Number(query?.room_id || 0)
  billId.value = Number(query?.id || 0)
  const res = await getMembers(roomId.value)
  const me = (res.data || []).find(m => m.user_id === authStore.userInfo?.id)
  isManager.value = !!me && me.role >= 1 && me.status === 1
})

onShow(() => load())

async function load() {
  const res = await getRentBillDetail(billId.value)
  bill.value = res.data
}

function preview(idx: number) {
  uni.previewImage({ urls: bill.value?.images || [], current: idx })
}

async function pay() {
  uni.showModal({
    title: '确认已线下完成支付？',
    content: '点击后标记为已支付',
    success: async (e) => {
      if (!e.confirm) return
      await payRentBill(billId.value)
      uni.showToast({ title: '已标记支付', icon: 'success' })
      load()
    },
  })
}

async function remove() {
  uni.showModal({
    title: '作废账单',
    content: '作废后不可恢复',
    success: async (e) => {
      if (!e.confirm) return
      await deleteRentBill(billId.value)
      uni.navigateBack()
    },
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.rent-detail-page {
  min-height: 100vh;
  padding-bottom: $space-16;
}

.amount-card {
  margin: 0 $space-5 $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  padding: $space-5;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__num {
    font-size: 56rpx;
    font-weight: 800;
    color: $danger;
    letter-spacing: -0.02em;
  }
}

.split-right {
  display: flex;
  align-items: center;
  gap: $space-3;

  &__pay {
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
  }
}

.img-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-2 0 $space-3;

  &__img {
    width: 140rpx;
    height: 140rpx;
    border-radius: $radius-md;
    background: $bg-hover;
  }
}

.remark {
  padding: $space-2 0 $space-3;
  font-size: $font-sm;
  color: $text-secondary;
  line-height: 1.6;
}
</style>

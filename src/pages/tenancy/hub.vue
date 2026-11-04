<template>
  <view class="hub-page">
    <view class="ui-header">
      <text class="ui-header__eyebrow">TENANCY · 租住全周期</text>
      <view class="ui-header__row">
        <text class="ui-header__title">租住管理</text>
      </view>
      <text class="ui-header__sub">验房 · 租房账单 · 退租 · 导出归档</text>
    </view>

    <view class="hub-list">
      <view class="card hub-card" @click="go('/pages/tenancy/lease/edit?room_id=' + roomId)">
        <view class="hub-card__head">
          <text class="hub-card__title">租约信息</text>
          <text v-if="lease" class="tag" :class="lease.status === 1 ? 'tag-success' : 'tag-primary'">{{ leaseStatusText }}</text>
        </view>
        <view v-if="lease" class="hub-card__body">
          <text class="hub-card__main">{{ lease.lease_start || '未填' }} ~ {{ lease.lease_end || '未填' }}</text>
          <text class="hub-card__sub">月租 ¥{{ lease.rent_amount || '-' }} · 押金 ¥{{ lease.deposit_amount || '-' }}</text>
        </view>
        <view v-else class="hub-card__body">
          <text class="hub-card__empty">未填写，点击去完善租约信息</text>
        </view>
      </view>

      <view class="card hub-card" @click="go('/pages/tenancy/inspect/list?room_id=' + roomId)">
        <view class="hub-card__head">
          <text class="hub-card__title">入住验房</text>
          <text v-if="activeInspect" class="tag tag-warning">进行中</text>
          <text v-else-if="effectiveInspect" class="tag tag-success">已生效</text>
        </view>
        <view class="hub-card__body">
          <text v-if="activeInspect" class="hub-card__main">确认进度 {{ activeInspect.confirm_done }}/{{ activeInspect.confirm_total }}</text>
          <text v-else-if="effectiveInspect" class="hub-card__main">{{ formatDate(effectiveInspect.effective_time) }} 生效</text>
          <text v-else class="hub-card__empty">未完成，点击去验房</text>
        </view>
      </view>

      <view class="card hub-card" @click="go('/pages/tenancy/rent-bill/list?room_id=' + roomId)">
        <view class="hub-card__head">
          <text class="hub-card__title">租房账单</text>
          <text v-if="unsettledCount > 0" class="tag tag-danger">{{ unsettledCount }} 笔未结清</text>
        </view>
        <view class="hub-card__body">
          <text v-if="unsettledCount > 0" class="hub-card__main">有待支付的租金/费用</text>
          <text v-else class="hub-card__empty">暂无未结清账单</text>
        </view>
      </view>

      <view class="card hub-card" @click="goCheckout">
        <view class="hub-card__head">
          <text class="hub-card__title">退租验收</text>
          <text v-if="activeCheckout" class="tag tag-warning">{{ checkoutStatusText }}</text>
        </view>
        <view class="hub-card__body">
          <text v-if="activeCheckout" class="hub-card__main">验收进行中，点击查看</text>
          <text v-else class="hub-card__empty">无进行中验收，点击可发起</text>
        </view>
      </view>

      <view class="card hub-card" @click="go('/pages/tenancy/export/index?room_id=' + roomId)">
        <view class="hub-card__head">
          <text class="hub-card__title">资料导出</text>
        </view>
        <view class="hub-card__body">
          <text class="hub-card__empty">验房 / 账单 / 验收 / 成员 一键归档</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getLease, getInspectList, getRentBillList, getCheckoutList } from '@/api/tenancy'
import type { Lease, InspectOrder, CheckoutOrder } from '@/types/tenancy'

const roomId = ref(0)
const lease = ref<Lease | null>(null)
const activeInspect = ref<InspectOrder | null>(null)
const effectiveInspect = ref<InspectOrder | null>(null)
const unsettledCount = ref(0)
const activeCheckout = ref<CheckoutOrder | null>(null)

const leaseStatusText = computed(() => ({ 0: '草稿', 1: '履约中', 2: '已退租' } as Record<number, string>)[lease.value?.status ?? 0])
const checkoutStatusText = computed(() => ({ 0: '草稿', 1: '验收中', 2: '待确认', 3: '已完成', 4: '有异议', 5: '已取消' } as Record<number, string>)[activeCheckout.value?.status ?? 0])

onLoad((query) => {
  roomId.value = Number(query?.room_id || 0)
})

onShow(async () => {
  if (!roomId.value) return
  const [leaseRes, inspectRes, effectiveRes, billRes, checkoutRes] = await Promise.all([
    getLease(roomId.value),
    getInspectList({ room_id: roomId.value, page_size: 1 }),
    getInspectList({ room_id: roomId.value, status: 2, page_size: 1 }),
    getRentBillList({ room_id: roomId.value, is_settled: false, page_size: 1 }),
    getCheckoutList({ room_id: roomId.value, page_size: 20 }),
  ])
  lease.value = leaseRes.data
  const latest = inspectRes.data.items[0]
  activeInspect.value = latest && [0, 1].includes(latest.status) ? latest : null
  effectiveInspect.value = effectiveRes.data.items[0] || null
  unsettledCount.value = billRes.data.total
  activeCheckout.value = checkoutRes.data.items.find(c => [0, 1, 2, 4].includes(c.status)) || null
})

function go(url: string) {
  uni.navigateTo({ url })
}

function goCheckout() {
  if (activeCheckout.value) {
    go(`/pages/tenancy/checkout/detail?room_id=${roomId.value}&id=${activeCheckout.value.id}`)
  } else {
    go(`/pages/tenancy/checkout/create?room_id=${roomId.value}`)
  }
}

function formatDate(t: string | null) {
  return t ? t.slice(0, 10) : ''
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.hub-page {
  min-height: 100vh;
  padding-bottom: $space-8;
}

.hub-list {
  padding: 0 $space-5;
}

.hub-card {
  margin-bottom: $space-4;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-2;
  }

  &__title {
    font-size: $font-base;
    font-weight: 700;
    color: $text-primary;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__main {
    font-size: $font-sm;
    color: $text-secondary;
  }

  &__sub {
    font-size: $font-xs;
    color: $text-hint;
  }

  &__empty {
    font-size: $font-sm;
    color: $text-hint;
  }
}
</style>

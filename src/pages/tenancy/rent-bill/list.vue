<template>
  <view class="rent-list-page">
    <view class="ui-header">
      <text class="ui-header__eyebrow">RENT BILL · 租房账单</text>
      <view class="ui-header__row">
        <text class="ui-header__title">租房账单</text>
        <view class="head-count">
          <text class="head-count-num">{{ bills.length }}</text>
          <text class="head-count-lbl">笔</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-x class="seg-scroll" :show-scrollbar="false">
      <view class="ui-seg">
        <view
          v-for="t in typeTabs" :key="t.label"
          class="ui-seg__item" :class="{ 'is-active': rentType === t.value }"
          @click="switchTab(t.value)"
        >
          <text>{{ t.label }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="list-wrap">
      <view v-if="bills.length === 0" class="empty-box">
        <EmptyState title="暂无租房账单" text="租金、押金等周期性账单在这里统一管理" />
      </view>
      <view v-for="b in bills" :key="b.id" class="bill-card" @click="goDetail(b.id)">
        <view class="bill-card__row">
          <text class="bill-card__title">{{ b.title }}</text>
          <text class="bill-card__amount">¥{{ b.amount }}</text>
        </view>
        <view class="bill-card__row bill-card__row--sub">
          <text>{{ typeText(b.rent_type) }} · {{ b.period_start || '' }}{{ b.period_end ? ' ~ ' + b.period_end : '' }}</text>
          <text class="tag" :class="b.is_settled ? 'tag-success' : 'tag-warning'">{{ b.is_settled ? '已结清' : '未结清' }}</text>
        </view>
        <view class="bill-card__row bill-card__row--sub" v-if="b.my_should_pay">
          <text>我应付 ¥{{ b.my_should_pay }}</text>
          <text class="tag" :class="b.my_pay_status === 2 ? 'tag-success' : 'tag-danger'">{{ b.my_pay_status === 2 ? '已支付' : '待支付' }}</text>
        </view>
      </view>
    </view>

    <template v-if="isManager">
      <view class="ui-bottom-spacer" />
      <view class="ui-bottom-bar">
        <button class="ui-btn ui-btn--ghost" @click="go('/pages/tenancy/rent-bill/create?room_id=' + roomId)">创建账单</button>
        <button class="ui-btn ui-btn--primary" :class="{ 'is-disabled': generating }" :disabled="generating" @click="generate">生成本期租金</button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getRentBillList, generateRentBills } from '@/api/tenancy'
import { getMembers } from '@/api/room'
import { useAuthStore } from '@/stores/auth'
import EmptyState from '@/components/EmptyState.vue'
import type { RentBill } from '@/types/tenancy'

const roomId = ref(0)
const bills = ref<RentBill[]>([])
const rentType = ref<number | undefined>(undefined)
const isManager = ref(false)
const generating = ref(false)

const typeTabs = [
  { label: '全部', value: undefined },
  { label: '租金', value: 0 },
  { label: '押金', value: 1 },
  { label: '中介费', value: 2 },
  { label: '物业费', value: 3 },
  { label: '其他', value: 5 },
]

onLoad(async (query) => {
  roomId.value = Number(query?.room_id || 0)
  const authStore = useAuthStore()
  const res = await getMembers(roomId.value)
  const me = (res.data || []).find(m => m.user_id === authStore.userInfo?.id)
  isManager.value = !!me && me.role >= 1 && me.status === 1
})

onShow(() => load())

async function load() {
  const res = await getRentBillList({ room_id: roomId.value, rent_type: rentType.value, page_size: 50 })
  bills.value = res.data.items
}

function switchTab(v: number | undefined) {
  rentType.value = v
  load()
}

function typeText(t: number) {
  return ({ 0: '租金', 1: '押金', 2: '中介费', 3: '物业费', 4: '维修分摊', 5: '其他' } as Record<number, string>)[t] || ''
}

function go(url: string) {
  uni.navigateTo({ url })
}

function goDetail(id: number) {
  go(`/pages/tenancy/rent-bill/detail?room_id=${roomId.value}&id=${id}`)
}

async function generate() {
  generating.value = true
  try {
    const res = await generateRentBills(roomId.value, 1)
    if (res.data.length === 0) {
      uni.showToast({ title: '本期已生成过', icon: 'none' })
    } else {
      uni.showToast({ title: '已生成', icon: 'success' })
    }
    load()
  } finally {
    generating.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.rent-list-page {
  min-height: 100vh;
  padding-bottom: $space-16;
}

.head-count {
  display: flex;
  align-items: baseline;
  gap: 4rpx;

  .head-count-num {
    font-size: $font-lg;
    font-weight: 800;
    color: $primary;
  }

  .head-count-lbl {
    font-size: $font-xs;
    color: $text-hint;
  }
}

.seg-scroll {
  margin-bottom: $space-4;
}

.list-wrap {
  padding: 0 $space-5;
}

.empty-box {
  padding-top: $space-8;
}

.bill-card {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  padding: $space-4;
  margin-bottom: $space-3;
  transition: $transition-base;

  &:active {
    transform: scale(0.99);
    box-shadow: $shadow-card;
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

  &__amount {
    font-size: $font-lg;
    font-weight: 800;
    color: $danger;
    flex-shrink: 0;
  }
}
</style>

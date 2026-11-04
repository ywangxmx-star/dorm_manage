<template>
  <view class="inspect-list-page">
    <view class="ui-header">
      <text class="ui-header__eyebrow">INSPECT · 入住验房</text>
      <view class="ui-header__row">
        <text class="ui-header__title">验房单</text>
        <view class="head-count">
          <text class="head-count-num">{{ orders.length }}</text>
          <text class="head-count-lbl">单</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-x class="seg-scroll" :show-scrollbar="false">
      <view class="ui-seg">
        <view
          v-for="t in statusTabs" :key="t.label"
          class="ui-seg__item" :class="{ 'is-active': status === t.value }"
          @click="switchTab(t.value)"
        >
          <text>{{ t.label }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="list-wrap">
      <view v-if="orders.length === 0 && !loading" class="empty-box">
        <EmptyState title="还没有验房单" text="入住时逐项拍照记录，退租对照不扯皮" />
      </view>
      <view
        v-for="(o, index) in orders" :key="o.id"
        class="order-card slide-up" :style="{ animationDelay: index * 50 + 'ms' }"
        @click="goDetail(o.id)"
      >
        <view class="order-card__row">
          <text class="order-card__title">入住验房单 #{{ o.id }}</text>
          <text class="tag" :class="statusTagClass(o.status)">{{ statusText(o.status) }}</text>
        </view>
        <view class="order-card__row order-card__row--sub">
          <text>{{ formatTime(o.create_time) }}</text>
          <text v-if="o.confirm_total">确认 {{ o.confirm_done }}/{{ o.confirm_total }}</text>
        </view>
      </view>
    </view>

    <view v-if="canCreate" class="ui-fab" @click="create">
      <text class="ui-fab__plus">+</text>
      <text class="ui-fab__text">发起验房</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getInspectList, createInspect } from '@/api/tenancy'
import { getMembers } from '@/api/room'
import { useAuthStore } from '@/stores/auth'
import EmptyState from '@/components/EmptyState.vue'
import type { InspectOrder } from '@/types/tenancy'

const roomId = ref(0)
const orders = ref<InspectOrder[]>([])
const status = ref<number | undefined>(undefined)
const canCreate = ref(false)
const loading = ref(false)

const statusTabs = [
  { label: '全部', value: undefined },
  { label: '草稿', value: 0 },
  { label: '待确认', value: 1 },
  { label: '已生效', value: 2 },
  { label: '已作废', value: 3 },
]

onLoad(async (query) => {
  roomId.value = Number(query?.room_id || 0)
  const authStore = useAuthStore()
  const res = await getMembers(roomId.value)
  const me = (res.data || []).find(m => m.user_id === authStore.userInfo?.id)
  canCreate.value = !!me && me.role >= 1 && me.status === 1
})

onShow(() => load())

async function load() {
  if (!roomId.value) return
  loading.value = true
  try {
    const res = await getInspectList({ room_id: roomId.value, status: status.value, page_size: 50 })
    orders.value = res.data.items
  } finally {
    loading.value = false
  }
}

function switchTab(v: number | undefined) {
  status.value = v
  load()
}

function statusText(s: number) {
  return ({ 0: '草稿', 1: '待确认', 2: '已生效', 3: '已作废', 4: '已归档' } as Record<number, string>)[s] || ''
}

function statusTagClass(s: number) {
  return ({
    0: 'tag-primary', 1: 'tag-warning', 2: 'tag-success', 3: 'tag-primary', 4: 'tag-lemon',
  } as Record<number, string>)[s]
}

function formatTime(t: string) {
  return t ? t.slice(0, 16).replace('T', ' ') : ''
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/tenancy/inspect/detail?room_id=${roomId.value}&id=${id}` })
}

async function create() {
  uni.navigateTo({ url: `/pages/tenancy/inspect/create?room_id=${roomId.value}` })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.inspect-list-page {
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

.order-card {
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

<template>
  <view class="checkout-create-page">
    <view class="ui-header">
      <text class="ui-header__eyebrow">CHECKOUT · 退租验收</text>
      <view class="ui-header__row">
        <text class="ui-header__title">发起退租验收</text>
      </view>
      <text class="ui-header__sub">选择对照的入住验房单</text>
    </view>

    <view class="body">
      <view v-if="effectiveInspect" class="inspect-card" @click="create(effectiveInspect.id)">
        <view class="inspect-card__row">
          <text class="inspect-card__title">验房单 #{{ effectiveInspect.id }}</text>
          <text class="tag tag-success">已生效</text>
        </view>
        <text class="inspect-card__sub">生效时间 {{ formatDate(effectiveInspect.effective_time) }} · 点击发起</text>
      </view>

      <view v-else class="warn-card">
        <view class="warn-card__icon">!</view>
        <text class="warn-card__title">无已生效的入住验房单</text>
        <text class="warn-card__sub">没有入住记录对照，退租验收将使用空白模板，缺损判定缺乏依据</text>
        <button class="ui-btn ui-btn--lemon warn-card__btn" @click="createBlank">仍要发起（空白模板）</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getInspectList, createCheckout } from '@/api/tenancy'
import type { InspectOrder } from '@/types/tenancy'

const roomId = ref(0)
const effectiveInspect = ref<InspectOrder | null>(null)

onLoad(async (query) => {
  roomId.value = Number(query?.room_id || 0)
  const res = await getInspectList({ room_id: roomId.value, status: 2, page_size: 1 })
  effectiveInspect.value = res.data.items[0] || null
})

async function create(inspectOrderId: number) {
  const res = await createCheckout({ room_id: roomId.value, inspect_order_id: inspectOrderId })
  uni.redirectTo({ url: `/pages/tenancy/checkout/detail?room_id=${roomId.value}&id=${res.data.id}` })
}

function createBlank() {
  uni.showModal({
    title: '确认使用空白模板？',
    content: '没有入住验房记录对照，退租纠纷风险较高',
    confirmText: '仍要发起',
    success: async (e) => {
      if (!e.confirm) return
      const res = await createCheckout({ room_id: roomId.value, use_blank: true })
      uni.redirectTo({ url: `/pages/tenancy/checkout/detail?room_id=${roomId.value}&id=${res.data.id}` })
    },
  })
}

function formatDate(t: string | null) {
  return t ? t.slice(0, 10) : ''
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.checkout-create-page {
  min-height: 100vh;
  padding-bottom: $space-16;
}

.body {
  padding: 0 $space-5;
}

.inspect-card {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  padding: $space-4;
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
  }

  &__title {
    font-size: $font-base;
    font-weight: 700;
    color: $text-primary;
  }

  &__sub {
    display: block;
    margin-top: $space-2;
    font-size: $font-xs;
    color: $text-hint;
  }
}

.warn-card {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  padding: $space-8 $space-5;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &__icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: $warning-bg;
    color: $warning;
    font-size: 48rpx;
    font-weight: 800;
    line-height: 80rpx;
    text-align: center;
    margin-bottom: $space-3;
  }

  &__title {
    font-size: $font-md;
    font-weight: 700;
    color: $text-primary;
  }

  &__sub {
    font-size: $font-xs;
    color: $text-hint;
    line-height: 1.6;
    margin: $space-2 0 $space-5;
  }

  &__btn {
    width: 100%;
    flex: none;
  }
}
</style>

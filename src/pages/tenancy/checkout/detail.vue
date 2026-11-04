<template>
  <view class="checkout-detail-page" v-if="order">
    <view class="ui-header">
      <text class="ui-header__eyebrow">CHECKOUT · 退租验收</text>
      <view class="ui-header__row">
        <text class="ui-header__title">验收单 #{{ order.id }}</text>
        <text class="tag" :class="statusTagClass(order.status)">{{ statusText }}</text>
      </view>
      <text class="ui-header__sub">缺损 {{ order.damage_count }} 项 · 确认 {{ order.confirm_done }}/{{ order.confirm_total }}</text>
    </view>

    <view v-if="order.status === 4 && order.dispute_reason" class="dispute-banner">
      异议：{{ order.dispute_reason }}
    </view>

    <view v-for="group in groupedItems" :key="group.name">
      <view class="ui-form-label">{{ group.name }}</view>
      <view v-for="item in group.items" :key="item.item_key" class="item-card" :class="{ 'is-damage': item.diff_type === 'new_damage' }">
        <view class="item-card__head">
          <text class="item-card__title">{{ item.title }}</text>
          <text v-if="item.diff_type === 'new_damage'" class="tag tag-danger">新增缺损</text>
          <text v-else-if="item.diff_type === 'legacy'" class="tag tag-warning">遗留</text>
        </view>

        <view class="checkin-box" v-if="item.checkin_result !== null">
          <text class="checkin-box__text">
            入住：{{ resultLabel(item.checkin_result) }}
            <text v-if="item.checkin_meter_value"> · 读数 {{ item.checkin_meter_value }}</text>
          </text>
          <view class="img-grid" v-if="item.checkin_images.length">
            <image
              v-for="(img, idx) in item.checkin_images" :key="idx"
              :src="img" mode="aspectFill" class="img-grid__img img-grid__img--small"
              @click="preview(item.checkin_images, idx)"
            />
          </view>
        </view>

        <view class="item-card__head item-card__head--gap">
          <text class="sub-label">退租状态</text>
          <view v-if="editable" class="r-picker">
            <text
              v-for="r in resultOptions" :key="r.value"
              class="r-picker__opt" :class="{ 'is-on': item.checkout_result === r.value }"
              @click="item.checkout_result = r.value"
            >{{ r.label }}</text>
          </view>
          <text v-else class="tag" :class="resultTagClass(item.checkout_result)">{{ resultLabel(item.checkout_result) }}</text>
        </view>

        <view v-if="editable" class="r-picker r-picker--gap">
          <text
            class="r-picker__opt" :class="{ 'is-on': item.is_damaged }"
            @click="item.is_damaged = !item.is_damaged"
          >缺损</text>
          <text
            v-if="item.checkout_result === 3"
            class="r-picker__opt" :class="{ 'is-on': item.is_repaired === true }"
            @click="item.is_repaired = item.is_repaired === true ? null : true"
          >已修复</text>
        </view>

        <view v-if="isMeter(item.item_key)" class="meter-row">
          <text class="meter-row__label">退租读数</text>
          <input v-if="editable" v-model="item.checkout_meter_value" placeholder="选填" class="meter-row__input" />
          <text v-else class="meter-row__value">{{ item.checkout_meter_value || '未填' }}</text>
        </view>

        <view class="img-grid">
          <image
            v-for="(img, idx) in item.images" :key="idx"
            :src="img" mode="aspectFill" class="img-grid__img"
            @click="preview(item.images, idx)"
          />
          <view v-if="editable && item.images.length < 9" class="img-grid__add" @click="addImage(item)">+</view>
        </view>

        <input v-if="editable" v-model="item.remark" placeholder="备注（可空）" class="remark-input" />
        <view v-else-if="item.remark" class="remark-text">备注：{{ item.remark }}</view>
      </view>
    </view>

    <view v-if="!editable && order.confirms.length">
      <view class="ui-form-label">确认人</view>
      <view class="confirm-panel">
        <view v-for="c in order.confirms" :key="c.user_id" class="ui-cell">
          <text class="ui-cell__label">{{ c.nickname || c.user_id }}{{ c.is_required ? '（必确认）' : '' }}</text>
          <text class="tag" :class="c.status === 1 ? 'tag-success' : 'tag-warning'">
            {{ c.status === 1 ? '已确认' : '待确认' }}
          </text>
        </view>
      </view>
    </view>

    <view class="ui-bottom-spacer" />
    <view class="ui-bottom-bar">
      <button v-if="editable" class="ui-btn ui-btn--ghost" :class="{ 'is-disabled': saving }" :disabled="saving" @click="save">保存</button>
      <button v-if="editable && isLeader" class="ui-btn ui-btn--primary" :class="{ 'is-disabled': saving }" :disabled="saving" @click="submit">提交确认</button>
      <button v-if="order.status === 2 && myConfirmPending" class="ui-btn ui-btn--primary" @click="confirm">确认无误</button>
      <button v-if="order.status === 2" class="ui-btn ui-btn--danger" @click="dispute">有异议</button>
      <button v-if="order.status === 2 && isLeader" class="ui-btn ui-btn--lemon" @click="complete">完成验收</button>
      <button v-if="[1, 4].includes(order.status) && isLeader" class="ui-btn ui-btn--danger" @click="cancel">取消验收</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  getCheckoutDetail, updateCheckoutItems, submitCheckout, confirmCheckout,
  disputeCheckout, completeCheckout, cancelCheckout,
} from '@/api/tenancy'
import { getMembers } from '@/api/room'
import { useAuthStore } from '@/stores/auth'
import { useImageUpload } from '@/composables/useImageUpload'
import type { CheckoutOrderDetail, CheckoutItemInput } from '@/types/tenancy'

const { chooseImages } = useImageUpload()
const authStore = useAuthStore()

const roomId = ref(0)
const checkoutId = ref(0)
const order = ref<CheckoutOrderDetail | null>(null)
const myRole = ref(0)
const saving = ref(false)

const resultOptions = [
  { value: 0, label: '正常' },
  { value: 1, label: '破损' },
  { value: 2, label: '缺失' },
  { value: 3, label: '待修' },
]

const editable = computed(() => !!order.value && [1, 4].includes(order.value.status) && myRole.value >= 1)
const isLeader = computed(() => myRole.value === 2)
const myConfirmPending = computed(() => {
  const me = order.value?.confirms.find(c => c.user_id === authStore.userInfo?.id)
  return !!me && me.status === 0
})
const statusText = computed(() => ({ 0: '草稿', 1: '验收中', 2: '待确认', 3: '已完成', 4: '有异议', 5: '已取消' } as Record<number, string>)[order.value?.status ?? 0])

const groupedItems = computed(() => {
  const groups: { name: string; items: any[] }[] = []
  for (const item of order.value?.items || []) {
    let g = groups.find(x => x.name === item.group_name)
    if (!g) {
      g = { name: item.group_name || '其他', items: [] }
      groups.push(g)
    }
    g.items.push(item)
  }
  return groups
})

onLoad((query) => {
  roomId.value = Number(query?.room_id || 0)
  checkoutId.value = Number(query?.id || 0)
})

onShow(async () => {
  const res = await getMembers(roomId.value)
  const me = (res.data || []).find(m => m.user_id === authStore.userInfo?.id)
  myRole.value = me?.role ?? 0
  await load()
})

async function load() {
  const res = await getCheckoutDetail(checkoutId.value)
  order.value = res.data
}

function isMeter(key: string) {
  return key.startsWith('meter_')
}

function resultLabel(r: number | null) {
  if (r === null) return '-'
  return resultOptions.find(o => o.value === r)?.label || ''
}

function statusTagClass(s: number) {
  return ({
    0: 'tag-primary', 1: 'tag-primary', 2: 'tag-warning', 3: 'tag-success', 4: 'tag-danger', 5: 'tag-primary',
  } as Record<number, string>)[s]
}

function resultTagClass(r: number | null) {
  if (r === null) return 'tag-primary'
  return ({ 0: 'tag-success', 1: 'tag-danger', 2: 'tag-danger', 3: 'tag-warning' } as Record<number, string>)[r]
}

function preview(images: string[], idx: number) {
  uni.previewImage({ urls: images, current: idx })
}

async function addImage(item: any) {
  const imgs = await chooseImages(9 - item.images.length)
  item.images.push(...imgs)
}

function buildInputs(): CheckoutItemInput[] {
  return (order.value?.items || []).map(i => ({
    item_key: i.item_key,
    checkout_result: i.checkout_result,
    checkout_meter_value: i.checkout_meter_value,
    images: i.images,
    is_damaged: i.is_damaged,
    is_repaired: i.is_repaired,
    remark: i.remark,
  }))
}

async function save() {
  saving.value = true
  try {
    const res = await updateCheckoutItems(checkoutId.value, buildInputs())
    order.value = res.data
    uni.showToast({ title: '已保存', icon: 'success' })
  } finally {
    saving.value = false
  }
}

async function submit() {
  saving.value = true
  try {
    await updateCheckoutItems(checkoutId.value, buildInputs())
    const res = await submitCheckout(checkoutId.value)
    order.value = res.data
  } finally {
    saving.value = false
  }
}

async function confirm() {
  uni.showModal({
    title: '确认退租验收结果',
    content: '确认后不可撤销',
    success: async (e) => {
      if (!e.confirm) return
      const res = await confirmCheckout(checkoutId.value)
      order.value = res.data
      uni.showToast({ title: '已确认', icon: 'success' })
    },
  })
}

function dispute() {
  uni.showModal({
    title: '提出异议',
    editable: true,
    placeholderText: '请填写异议理由',
    success: async (e) => {
      if (!e.confirm || !e.content?.trim()) return
      const res = await disputeCheckout(checkoutId.value, e.content.trim())
      order.value = res.data
    },
  })
}

async function complete() {
  uni.showModal({
    title: '完成退租验收',
    content: '完成后租约将关闭，验收单只读归档',
    success: async (e) => {
      if (!e.confirm) return
      const res = await completeCheckout(checkoutId.value)
      order.value = res.data
      uni.showToast({ title: '已完成', icon: 'success' })
    },
  })
}

async function cancel() {
  uni.showModal({
    title: '取消退租验收',
    success: async (e) => {
      if (!e.confirm) return
      await cancelCheckout(checkoutId.value)
      uni.navigateBack()
    },
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.checkout-detail-page {
  min-height: 100vh;
  padding-bottom: $space-16;
}

.dispute-banner {
  margin: 0 $space-5 $space-4;
  background: $danger-bg;
  color: $danger;
  border-radius: $radius-md;
  padding: $space-3 $space-4;
  font-size: $font-xs;
  line-height: 1.6;
}

.item-card {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  padding: $space-4;
  margin: 0 $space-5 $space-3;

  &.is-damage {
    border-left: 8rpx solid $danger;
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-3;

    &--gap {
      margin-top: $space-3;
    }
  }

  &__title {
    font-size: $font-base;
    font-weight: 700;
    color: $text-primary;
  }
}

.sub-label {
  font-size: $font-xs;
  color: $text-hint;
}

.checkin-box {
  margin-top: $space-2;

  &__text {
    font-size: $font-xs;
    color: $text-hint;
  }
}

.r-picker {
  display: flex;
  gap: $space-2;

  &--gap {
    margin-top: $space-2;
  }

  &__opt {
    font-size: $font-xs;
    padding: 8rpx 20rpx;
    border-radius: $radius-full;
    background: $bg-hover;
    color: $text-secondary;
    font-weight: 600;
    transition: $transition-fast;

    &.is-on {
      background: $primary;
      color: $text-white;
    }
  }
}

.meter-row {
  display: flex;
  align-items: center;
  margin-top: $space-3;

  &__label {
    font-size: $font-xs;
    color: $text-hint;
    margin-right: $space-3;
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    font-size: $font-sm;
    border-bottom: 2rpx solid $border-color;
    padding-bottom: $space-1;
  }

  &__value {
    font-size: $font-sm;
    color: $text-primary;
    font-weight: 600;
  }
}

.img-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-top: $space-3;

  &__img {
    width: 140rpx;
    height: 140rpx;
    border-radius: $radius-md;
    background: $bg-hover;

    &--small {
      width: 100rpx;
      height: 100rpx;
    }
  }

  &__add {
    width: 140rpx;
    height: 140rpx;
    border-radius: $radius-md;
    background: $bg-hover;
    border: 2rpx dashed $border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56rpx;
    color: $text-hint;

    &:active {
      opacity: 0.7;
    }
  }
}

.remark-input {
  margin-top: $space-3;
  font-size: $font-sm;
  border-bottom: 2rpx solid $border-color;
  padding-bottom: $space-2;
}

.remark-text {
  margin-top: $space-3;
  font-size: $font-xs;
  color: $text-hint;
}

.confirm-panel {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  padding: 0 $space-4;
  margin: 0 $space-5 $space-4;
}
</style>

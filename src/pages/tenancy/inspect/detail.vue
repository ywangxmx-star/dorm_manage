<template>
  <view class="inspect-detail-page" v-if="order">
    <view class="ui-header">
      <text class="ui-header__eyebrow">INSPECT · 验房单</text>
      <view class="ui-header__row">
        <text class="ui-header__title">验房单 #{{ order.id }}</text>
        <text class="tag" :class="statusTagClass(order.status)">{{ statusText }}</text>
      </view>
      <text v-if="order.confirm_total" class="ui-header__sub">
        确认进度 {{ order.confirm_done }}/{{ order.confirm_total }}
      </text>
    </view>

    <view v-for="group in groupedItems" :key="group.name">
      <view class="ui-form-label">{{ group.name }}</view>
      <view v-for="item in group.items" :key="item.item_key" class="item-card">
        <view class="item-card__head">
          <text class="item-card__title">{{ item.title }}</text>
          <view v-if="editable" class="r-picker">
            <text
              v-for="r in resultOptions" :key="r.value"
              class="r-picker__opt" :class="{ 'is-on': item.result === r.value }"
              @click="item.result = r.value"
            >{{ r.label }}</text>
          </view>
          <text v-else class="tag" :class="resultTagClass(item.result)">{{ resultLabel(item.result) }}</text>
        </view>

        <view v-if="isMeter(item.item_key)" class="meter-row">
          <text class="meter-row__label">读数</text>
          <input v-if="editable" v-model="item.meter_value" placeholder="必填" class="meter-row__input" />
          <text v-else class="meter-row__value">{{ item.meter_value || '未填' }}</text>
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
          <text class="ui-cell__label">{{ c.nickname || c.user_id }}</text>
          <text class="tag" :class="c.status === 1 ? 'tag-success' : 'tag-warning'">
            {{ c.status === 1 ? '已确认' : '待确认' }}
          </text>
        </view>
      </view>
    </view>

    <view class="ui-bottom-spacer" />
    <view class="ui-bottom-bar">
      <button v-if="order.status === 0 && isManager" class="ui-btn ui-btn--ghost" :class="{ 'is-disabled': saving }" :disabled="saving" @click="saveDraft">保存草稿</button>
      <button v-if="order.status === 0 && isManager" class="ui-btn ui-btn--primary" :class="{ 'is-disabled': saving }" :disabled="saving" @click="submit">提交待确认</button>
      <button v-if="order.status === 1 && myConfirmPending" class="ui-btn ui-btn--primary" @click="confirm">确认无误</button>
      <button v-if="[0, 1].includes(order.status) && isLeader" class="ui-btn ui-btn--danger" @click="voidOrder">作废</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  getInspectDetail, updateInspect, submitInspect, confirmInspect, voidInspect,
} from '@/api/tenancy'
import { getMembers } from '@/api/room'
import { useAuthStore } from '@/stores/auth'
import { useImageUpload } from '@/composables/useImageUpload'
import type { InspectOrderDetail, InspectItemInput } from '@/types/tenancy'

const { chooseImages } = useImageUpload()
const authStore = useAuthStore()

const roomId = ref(0)
const orderId = ref(0)
const order = ref<InspectOrderDetail | null>(null)
const myRole = ref(0)
const saving = ref(false)

const resultOptions = [
  { value: 0, label: '正常' },
  { value: 1, label: '破损' },
  { value: 2, label: '缺失' },
  { value: 3, label: '待修' },
]

const editable = computed(() => order.value?.status === 0 && myRole.value >= 1)
const isManager = computed(() => myRole.value >= 1)
const isLeader = computed(() => myRole.value === 2)
const myConfirmPending = computed(() => {
  const me = order.value?.confirms.find(c => c.user_id === authStore.userInfo?.id)
  return !!me && me.status === 0
})
const statusText = computed(() => ({ 0: '草稿', 1: '待确认', 2: '已生效', 3: '已作废', 4: '已归档' } as Record<number, string>)[order.value?.status ?? 0])

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
  orderId.value = Number(query?.id || 0)
})

onShow(async () => {
  const res = await getMembers(roomId.value)
  const me = (res.data || []).find(m => m.user_id === authStore.userInfo?.id)
  myRole.value = me?.role ?? 0
  await load()
})

async function load() {
  const res = await getInspectDetail(orderId.value)
  order.value = res.data
}

function isMeter(key: string) {
  return key.startsWith('meter_')
}

function resultLabel(r: number) {
  return resultOptions.find(o => o.value === r)?.label || ''
}

function statusTagClass(s: number) {
  return ({
    0: 'tag-primary', 1: 'tag-warning', 2: 'tag-success', 3: 'tag-primary', 4: 'tag-lemon',
  } as Record<number, string>)[s]
}

function resultTagClass(r: number) {
  return ({ 0: 'tag-success', 1: 'tag-danger', 2: 'tag-danger', 3: 'tag-warning' } as Record<number, string>)[r]
}

function preview(images: string[], idx: number) {
  uni.previewImage({ urls: images, current: idx })
}

async function addImage(item: any) {
  const imgs = await chooseImages(9 - item.images.length)
  item.images.push(...imgs)
}

function buildInputs(): InspectItemInput[] {
  return (order.value?.items || []).map(i => ({
    item_key: i.item_key,
    title: i.title,
    group_name: i.group_name,
    result: i.result,
    images: i.images,
    meter_value: i.meter_value,
    remark: i.remark,
    sort: i.sort,
  }))
}

async function saveDraft() {
  saving.value = true
  try {
    const res = await updateInspect(orderId.value, buildInputs())
    order.value = res.data
    uni.showToast({ title: '已保存', icon: 'success' })
  } finally {
    saving.value = false
  }
}

async function submit() {
  saving.value = true
  try {
    await updateInspect(orderId.value, buildInputs())
    uni.showModal({
      title: '提交验房单',
      content: '提交后将通知全体成员确认，确认前不可再修改',
      success: async (e) => {
        if (!e.confirm) return
        const res = await submitInspect(orderId.value)
        order.value = res.data
      },
    })
  } finally {
    saving.value = false
  }
}

async function confirm() {
  uni.showModal({
    title: '确认验房结果',
    content: '确认后不可撤销',
    success: async (e) => {
      if (!e.confirm) return
      const res = await confirmInspect(orderId.value)
      order.value = res.data
      uni.showToast({ title: '已确认', icon: 'success' })
    },
  })
}

async function voidOrder() {
  uni.showModal({
    title: '作废验房单',
    content: '作废后不可恢复',
    success: async (e) => {
      if (!e.confirm) return
      await voidInspect(orderId.value)
      uni.navigateBack()
    },
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.inspect-detail-page {
  min-height: 100vh;
  padding-bottom: $space-16;
}

.item-card {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  padding: $space-4;
  margin: 0 $space-5 $space-3;

  &__head {
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
}

.r-picker {
  display: flex;
  gap: $space-2;

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

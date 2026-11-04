<template>
  <view class="rent-create-page">
    <view class="ui-header">
      <text class="ui-header__eyebrow">RENT BILL · 创建</text>
      <view class="ui-header__row">
        <text class="ui-header__title">创建账单</text>
      </view>
      <text class="ui-header__sub">租金、押金等费用，创建后按分摊方式生成个人账单</text>
    </view>

    <text class="ui-form-label">基本信息</text>
    <view class="ui-form-group">
      <view class="cell">
        <text class="cell-label">标题</text>
        <input class="cell-input" v-model="form.title" placeholder="如 2026-04 租金" />
      </view>
      <view class="cell">
        <text class="cell-label">总金额</text>
        <input class="cell-input" v-model="form.amount" type="digit" placeholder="元" />
      </view>
      <view class="cell">
        <text class="cell-label">类型</text>
        <picker :range="typeOptions" :value="form.rent_type" @change="e => form.rent_type = Number(e.detail.value)">
          <view class="cell-picker">{{ typeOptions[form.rent_type] }}</view>
        </picker>
      </view>
      <view class="cell">
        <text class="cell-label">应付日</text>
        <picker mode="date" :value="form.due_date || ''" @change="e => form.due_date = e.detail.value">
          <view class="cell-picker">{{ form.due_date || '请选择' }}</view>
        </picker>
      </view>
      <view class="cell">
        <text class="cell-label">分摊方式</text>
        <picker :range="splitOptions" :value="form.split_type" @change="e => form.split_type = Number(e.detail.value)">
          <view class="cell-picker">{{ splitOptions[form.split_type] }}</view>
        </picker>
      </view>
    </view>

    <template v-if="form.rent_type === 0">
      <text class="ui-form-label">账期</text>
      <view class="ui-form-group">
        <view class="cell">
          <text class="cell-label">账期起</text>
          <picker mode="date" :value="form.period_start || ''" @change="e => form.period_start = e.detail.value">
            <view class="cell-picker">{{ form.period_start || '请选择' }}</view>
          </picker>
        </view>
        <view class="cell">
          <text class="cell-label">账期止</text>
          <picker mode="date" :value="form.period_end || ''" @change="e => form.period_end = e.detail.value">
            <view class="cell-picker">{{ form.period_end || '请选择' }}</view>
          </picker>
        </view>
      </view>
    </template>

    <text class="ui-form-label">备注与凭证</text>
    <view class="ui-form-group">
      <textarea class="cell-textarea" v-model="form.remark" placeholder="备注（可空）" />
      <view class="img-grid">
        <image v-for="(img, idx) in form.images" :key="idx" :src="img" mode="aspectFill" class="img-grid__img" />
        <view v-if="form.images.length < 9" class="img-grid__add" @click="addImage">+</view>
      </view>
    </view>

    <view class="ui-bottom-bar">
      <view class="ui-btn ui-btn--primary" :class="{ 'is-disabled': saving }" @click="save">创建</view>
    </view>
    <view class="ui-bottom-spacer"></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createRentBill } from '@/api/tenancy'
import { useImageUpload } from '@/composables/useImageUpload'

const { chooseImages } = useImageUpload()
const roomId = ref(0)
const saving = ref(false)
const typeOptions = ['租金', '押金', '中介费', '物业费', '维修分摊', '其他']
const splitOptions = ['AA 均分', '自定义金额', '按比例']

const form = ref({
  title: '',
  amount: '',
  rent_type: 0,
  period_start: null as string | null,
  period_end: null as string | null,
  due_date: null as string | null,
  split_type: 0,
  images: [] as string[],
  remark: '',
})

onLoad((query) => {
  roomId.value = Number(query?.room_id || 0)
})

async function addImage() {
  const imgs = await chooseImages(9 - form.value.images.length)
  form.value.images.push(...imgs)
}

async function save() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  if (!form.value.amount || Number(form.value.amount) <= 0) {
    uni.showToast({ title: '请填写正确金额', icon: 'none' })
    return
  }
  if (form.value.rent_type === 0 && !form.value.period_start) {
    uni.showToast({ title: '租金账单需选择账期', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await createRentBill({
      room_id: roomId.value,
      title: form.value.title,
      amount: form.value.amount,
      rent_type: form.value.rent_type,
      period_start: form.value.period_start,
      period_end: form.value.period_end,
      due_date: form.value.due_date,
      split_type: form.value.split_type,
      images: form.value.images,
      remark: form.value.remark,
    })
    uni.showToast({ title: '已创建', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.rent-create-page {
  min-height: 100vh;
}

.cell {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: 24rpx 0;
  border-bottom: 2rpx dashed $border-color;

  &:last-child {
    border-bottom: none;
  }

  .cell-label {
    width: 150rpx;
    flex-shrink: 0;
    font-size: $font-sm;
    color: $text-secondary;
  }

  .cell-input,
  .cell-picker {
    flex: 1;
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
    text-align: right;
  }

  .cell-textarea {
    width: 100%;
    min-height: 140rpx;
    padding: $space-2 0;
    font-size: $font-sm;
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
</style>

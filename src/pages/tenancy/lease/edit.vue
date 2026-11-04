<template>
  <view class="lease-page">
    <view class="ui-header">
      <text class="ui-header__eyebrow">LEASE · 租约</text>
      <view class="ui-header__row">
        <text class="ui-header__title">租约信息</text>
      </view>
      <text class="ui-header__sub">验房、租金、退租的基础上下文</text>
    </view>

    <text class="ui-form-label">房源与联系人</text>
    <view class="ui-form-group">
      <view class="cell">
        <text class="cell-label">房源地址</text>
        <input class="cell-input" v-model="form.address" placeholder="请输入" />
      </view>
      <view class="cell">
        <text class="cell-label">房东/中介</text>
        <input class="cell-input" v-model="form.landlord_name" placeholder="请输入" />
      </view>
      <view class="cell">
        <text class="cell-label">联系电话</text>
        <input class="cell-input" v-model="form.landlord_phone" type="number" placeholder="请输入" />
      </view>
    </view>

    <text class="ui-form-label">租期与费用</text>
    <view class="ui-form-group">
      <view class="cell">
        <text class="cell-label">起租日</text>
        <picker mode="date" :value="form.lease_start || ''" @change="e => form.lease_start = e.detail.value">
          <view class="cell-picker">{{ form.lease_start || '请选择' }}</view>
        </picker>
      </view>
      <view class="cell">
        <text class="cell-label">到期日</text>
        <picker mode="date" :value="form.lease_end || ''" @change="e => form.lease_end = e.detail.value">
          <view class="cell-picker">{{ form.lease_end || '请选择' }}</view>
        </picker>
      </view>
      <view class="cell">
        <text class="cell-label">月租金</text>
        <input class="cell-input" v-model="form.rent_amount" type="digit" placeholder="元/月" />
      </view>
      <view class="cell">
        <text class="cell-label">押金</text>
        <input class="cell-input" v-model="form.deposit_amount" type="digit" placeholder="元（仅记录）" />
      </view>
      <view class="cell">
        <text class="cell-label">支付周期</text>
        <picker :range="cycleOptions" :value="form.payment_cycle" @change="e => form.payment_cycle = Number(e.detail.value)">
          <view class="cell-picker">{{ cycleOptions[form.payment_cycle] }}</view>
        </picker>
      </view>
      <view class="cell">
        <text class="cell-label">每月应付日</text>
        <input class="cell-input" v-model.number="form.rent_due_day" type="number" placeholder="1-28" />
      </view>
    </view>

    <text class="ui-form-label">表计底数（可空，验房可回写）</text>
    <view class="ui-form-group">
      <view class="cell">
        <text class="cell-label">水表</text>
        <input class="cell-input" v-model="form.water_meter_start" placeholder="可空" />
      </view>
      <view class="cell">
        <text class="cell-label">电表</text>
        <input class="cell-input" v-model="form.electric_meter_start" placeholder="可空" />
      </view>
      <view class="cell">
        <text class="cell-label">气表</text>
        <input class="cell-input" v-model="form.gas_meter_start" placeholder="可空" />
      </view>
    </view>

    <text class="ui-form-label">备注</text>
    <view class="ui-form-group">
      <textarea class="cell-textarea" v-model="form.remark" placeholder="可空" />
    </view>

    <view class="ui-bottom-bar">
      <view class="ui-btn ui-btn--primary" :class="{ 'is-disabled': saving }" @click="save">保存</view>
    </view>
    <view class="ui-bottom-spacer"></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getLease, upsertLease } from '@/api/tenancy'
import type { LeaseUpsertParams } from '@/types/tenancy'

const roomId = ref(0)
const saving = ref(false)
const cycleOptions = ['月付', '季付', '半年付', '年付']
const form = ref<Required<LeaseUpsertParams>>({
  address: '', landlord_name: '', landlord_phone: '',
  lease_start: null, lease_end: null,
  rent_amount: null, deposit_amount: null,
  payment_cycle: 0, rent_due_day: 1,
  water_meter_start: '', electric_meter_start: '', gas_meter_start: '',
  remark: '', status: 1,
})

onLoad(async (query) => {
  roomId.value = Number(query?.room_id || 0)
  if (!roomId.value) return
  const res = await getLease(roomId.value)
  if (res.data) {
    const l = res.data
    form.value = {
      address: l.address, landlord_name: l.landlord_name, landlord_phone: l.landlord_phone,
      lease_start: l.lease_start, lease_end: l.lease_end,
      rent_amount: l.rent_amount, deposit_amount: l.deposit_amount,
      payment_cycle: l.payment_cycle, rent_due_day: l.rent_due_day,
      water_meter_start: l.water_meter_start, electric_meter_start: l.electric_meter_start,
      gas_meter_start: l.gas_meter_start, remark: l.remark, status: l.status,
    }
  }
})

async function save() {
  if (saving.value) return
  if (form.value.rent_due_day < 1 || form.value.rent_due_day > 28) {
    uni.showToast({ title: '应付日需在 1-28 之间', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await upsertLease(roomId.value, form.value)
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.lease-page {
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
</style>

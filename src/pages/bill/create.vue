<template>
  <view class="create-bill-page">
    <view class="nav">
      <view class="nav-inner">
        <view class="nav-back" aria-label="返回" @click="handleBack">
          <view class="nav-back__chevron"></view>
        </view>
        <text class="nav-title">记一笔账</text>
        <view class="nav-placeholder"></view>
      </view>
    </view>

    <view class="form-body">
      <view class="ui-panel amount-panel">
        <text class="amount-label">{{ autoTitle }}</text>
        <view class="amount-wrap" :class="{ 'is-focused': amountFocused }">
          <text class="amount-prefix">¥</text>
          <input
            v-model="form.amount"
            class="amount-input"
            type="digit"
            placeholder="0.00"
            placeholder-class="amount-placeholder"
            maxlength="10"
            @focus="amountFocused = true"
            @blur="amountFocused = false"
          />
          <view v-if="form.amount && Number(form.amount) > 0" class="amount-clear" aria-label="清空金额" @click="form.amount = ''">
            <view class="amount-clear__x"></view>
          </view>
        </view>
      </view>

      <text class="ui-form-label">分摊设置</text>
      <view class="ui-form-group">
        <picker :range="billTypeOptions" :range-key="'label'" :value="typeIndex" @change="onTypeChange">
          <view class="ui-row">
            <text class="ui-row__label">消费类型</text>
            <view class="ui-row__value">
              <text>{{ billTypeOptions[typeIndex].label }}</text>
              <view class="ui-row__arrow"></view>
            </view>
          </view>
        </picker>
        <picker :range="splitTypeOptions" :range-key="'label'" :value="splitIndex" @change="onSplitChange">
          <view class="ui-row">
            <text class="ui-row__label">分摊方式</text>
            <view class="ui-row__value">
              <text>{{ splitTypeOptions[splitIndex].label }}</text>
              <view class="ui-row__arrow"></view>
            </view>
          </view>
        </picker>
        <text class="split-hint">{{ splitTypeHint }}</text>
      </view>

      <view class="label-row">
        <text class="ui-form-label">成员分摊<text v-if="selectedMembers.length > 0" class="label-count"> · 已选 {{ selectedMembers.length }}</text></text>
        <text v-if="members.length > 0" class="label-action" @click="selectedMembers.length < members.length ? selectAll() : deselectAll()">
          {{ selectedMembers.length < members.length ? '全选' : '取消全选' }}
        </text>
      </view>
      <view class="ui-form-group">
        <view
          v-for="member in members"
          :key="member.user_id"
          class="member-item"
          :class="{ 'is-selected': isSelected(member.user_id) }"
          @click="toggleMember(member.user_id)"
        >
          <view class="member-check" :class="{ 'is-on': isSelected(member.user_id) }">
            <view class="member-check__mark"></view>
          </view>
          <view class="member-avatar" :class="getAvatarColorClass(member.user_id)">
            <text class="member-avatar-text">{{ getAvatarText(member) }}</text>
          </view>
          <view class="member-info">
            <text class="member-name">{{ member.nickname || `用户 #${member.user_id}` }}</text>
            <text v-if="isSelected(member.user_id) && form.amount && Number(form.amount) > 0 && form.split_type !== 1" class="member-amount num">
              ¥{{ getMemberAmount(member.user_id) }}
            </text>
          </view>
          <view v-if="isSelected(member.user_id) && form.split_type === 1" class="split-box" @click.stop>
            <text class="split-box__affix">¥</text>
            <input v-model="memberAmounts[member.user_id]" class="split-box__input" type="digit" placeholder="0.00" />
          </view>
          <view v-else-if="isSelected(member.user_id) && form.split_type === 2" class="split-box" @click.stop>
            <input v-model="memberRatios[member.user_id]" class="split-box__input" type="digit" placeholder="0" />
            <text class="split-box__affix">%</text>
          </view>
        </view>
        <view v-if="members.length === 0" class="member-empty">暂无宿舍成员</view>
      </view>

      <view v-if="form.amount && Number(form.amount) > 0 && selectedMembers.length > 0 && form.split_type === 1 && !isCustomAmountValid" class="warn-bar">
        <text class="warn-bar-text">分摊金额合计 ¥{{ currentTotalAmount.toFixed(2) }}，需等于 ¥{{ Number(form.amount).toFixed(2) }}</text>
      </view>
      <view v-if="form.amount && Number(form.amount) > 0 && selectedMembers.length > 0 && form.split_type === 2 && !isPercentageValid" class="warn-bar">
        <text class="warn-bar-text">百分比合计 {{ currentTotalPercent.toFixed(1) }}%，需等于 100%</text>
      </view>

      <text class="ui-form-label">备注</text>
      <view class="ui-form-group">
        <view class="ui-field">
          <textarea v-model="form.remark" class="ui-textarea remark-textarea" placeholder="如：已付给房东、包含水费（选填）" maxlength="200" />
        </view>
      </view>

      <view class="ui-bottom-spacer"></view>
    </view>

    <view class="ui-bottom-bar">
      <view class="bar-summary">
        <text class="bar-summary__amount num">¥{{ form.amount && Number(form.amount) > 0 ? Number(form.amount).toFixed(2) : '0.00' }}</text>
        <text class="bar-summary__sub">{{ selectedMembers.length }} 人分摊</text>
      </view>
      <view
        class="ui-btn ui-btn--primary bar-btn"
        :class="{ 'is-disabled': !canSubmit || submitting }"
        @click="canSubmit && !submitting && handleSubmit()"
      >
        {{ submitting ? '创建中...' : '确认创建' }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoomStore } from '@/stores/room'
import { createBill } from '@/api/bill'
import { getMembers } from '@/api/room'
import { BILL_TYPE_OPTIONS, SPLIT_TYPE_OPTIONS } from '@/constants/bill'
import type { Member } from '@/types/room'

const roomStore = useRoomStore()
const billTypeOptions = BILL_TYPE_OPTIONS
const splitTypeOptions = SPLIT_TYPE_OPTIONS

const typeIndex = ref(4)
const splitIndex = ref(0)
const submitting = ref(false)
const members = ref<Member[]>([])
const selectedMembers = ref<number[]>([])
const memberAmounts = reactive<Record<number, string>>({})
const memberRatios = reactive<Record<number, string>>({})
const amountFocused = ref(false)
const showRemark = ref(false)

const form = reactive({
  amount: '',
  bill_type: 4,
  split_type: 0,
  remark: '',
})

const autoTitle = computed(() => {
  if (!form.amount || Number(form.amount) <= 0) return ''
  const typeLabel = billTypeOptions[typeIndex.value].label
  const amt = Number(form.amount).toFixed(2)
  return `${typeLabel} · ¥${amt}`
})

const splitTypeHint = computed(() => {
  const hints: Record<number, string> = {
    0: '总金额平均分摊给每个人',
    1: '为每个成员分别设置金额',
    2: '按百分比分配，总和需为 100%',
  }
  return hints[form.split_type] || ''
})

const canSubmit = computed(() => {
  if (!form.amount || Number(form.amount) <= 0) return false
  if (selectedMembers.value.length === 0) return false
  if (form.split_type === 0) return true
  if (form.split_type === 1) {
    if (!selectedMembers.value.every(id => memberAmounts[id] && Number(memberAmounts[id]) > 0)) return false
    const sum = selectedMembers.value.reduce((s, id) => s + (Number(memberAmounts[id]) || 0), 0)
    return Math.abs(sum - Number(form.amount)) < 0.01
  }
  if (form.split_type === 2) {
    if (!selectedMembers.value.every(id => memberRatios[id] && Number(memberRatios[id]) > 0)) return false
    const sum = selectedMembers.value.reduce((s, id) => s + (Number(memberRatios[id]) || 0), 0)
    return Math.abs(sum - 100) < 0.01
  }
  return false
})

const isCustomAmountValid = computed(() => {
  if (form.split_type !== 1) return true
  const sum = selectedMembers.value.reduce((s, id) => s + (Number(memberAmounts[id]) || 0), 0)
  return Math.abs(sum - Number(form.amount)) < 0.01
})

const isPercentageValid = computed(() => {
  if (form.split_type !== 2) return true
  const sum = selectedMembers.value.reduce((s, id) => s + (Number(memberRatios[id]) || 0), 0)
  return Math.abs(sum - 100) < 0.01
})

const currentTotalAmount = computed(() => {
  return selectedMembers.value.reduce((s, id) => s + (Number(memberAmounts[id]) || 0), 0)
})

const currentTotalPercent = computed(() => {
  return selectedMembers.value.reduce((s, id) => s + (Number(memberRatios[id]) || 0), 0)
})

onMounted(async () => {
  const roomId = roomStore.currentRoom?.id
  if (roomId) {
    const res = await getMembers(roomId)
    members.value = res.data
    for (const m of res.data) {
      memberAmounts[m.user_id] = ''
      memberRatios[m.user_id] = ''
    }
    for (const m of res.data) {
      if (!selectedMembers.value.includes(m.user_id)) {
        selectedMembers.value.push(m.user_id)
      }
    }
  }
})

watch(() => form.amount, (newVal) => {
  if (!newVal || Number(newVal) <= 0) return
  const total = Number(newVal)
  if (form.split_type === 1 && selectedMembers.value.length > 0) {
    const perAmount = total / selectedMembers.value.length
    selectedMembers.value.forEach(id => {
      memberAmounts[id] = perAmount.toFixed(2)
    })
  }
  if (form.split_type === 2 && selectedMembers.value.length > 0) {
    const perRatio = 100 / selectedMembers.value.length
    selectedMembers.value.forEach(id => {
      memberRatios[id] = perRatio.toFixed(1)
    })
  }
})

function getMemberAmount(userId: number): string {
  if (form.split_type === 0) {
    return (Number(form.amount) / selectedMembers.value.length).toFixed(2)
  }
  if (form.split_type === 1) {
    return Number(memberAmounts[userId] || 0).toFixed(2)
  }
  if (form.split_type === 2) {
    const ratio = Number(memberRatios[userId] || 0)
    return ((Number(form.amount) * ratio) / 100).toFixed(2)
  }
  return '0.00'
}

function isSelected(userId: number) {
  return selectedMembers.value.includes(userId)
}

function toggleMember(userId: number) {
  const index = selectedMembers.value.indexOf(userId)
  if (index === -1) {
    selectedMembers.value.push(userId)
  } else {
    selectedMembers.value.splice(index, 1)
  }
}

function selectAll() {
  members.value.forEach(m => {
    if (!isSelected(m.user_id)) {
      selectedMembers.value.push(m.user_id)
    }
  })
}

function deselectAll() {
  selectedMembers.value.length = 0
}

function handleBack() {
  uni.navigateBack()
}

function getAvatarColorClass(userId: number): string {
  const colors = ['avatar-purple', 'avatar-green', 'avatar-amber', 'avatar-blue', 'avatar-rose', 'avatar-teal']
  return colors[userId % colors.length]
}

function getAvatarText(member: Member): string {
  return (member.nickname || `#${member.user_id}`).charAt(0).toUpperCase()
}

watch(memberAmounts, () => {
  if (form.split_type !== 1) return
  const total = Number(form.amount)
  const currentTotal = selectedMembers.value.reduce((s, id) => s + (Number(memberAmounts[id]) || 0), 0)
  if (currentTotal > total) {
    for (let i = selectedMembers.value.length - 1; i >= 0; i--) {
      const userId = selectedMembers.value[i]
      const val = Number(memberAmounts[userId]) || 0
      if (val > 0) {
        const othersSum = selectedMembers.value
          .filter(id => id !== userId)
          .reduce((s, id) => s + (Number(memberAmounts[id]) || 0), 0)
        const max = Math.max(0, total - othersSum)
        if (val > max) {
          memberAmounts[userId] = String(max)
          uni.showToast({ title: `最多还能分配 ¥${max.toFixed(2)}`, icon: 'none' })
        }
        break
      }
    }
  }
}, { deep: true })

watch(memberRatios, () => {
  if (form.split_type !== 2) return
  for (let i = selectedMembers.value.length - 1; i >= 0; i--) {
    const userId = selectedMembers.value[i]
    const val = Number(memberRatios[userId]) || 0
    if (val > 0) {
      const othersSum = selectedMembers.value
        .filter(id => id !== userId)
        .reduce((s, id) => s + (Number(memberRatios[id]) || 0), 0)
      const max = Math.max(0, 100 - othersSum)
      if (val > max) {
        memberRatios[userId] = String(max)
        uni.showToast({ title: `最多还能分配 ${max.toFixed(1)}%`, icon: 'none' })
      }
      break
    }
  }
}, { deep: true })

function onTypeChange(e: any) {
  typeIndex.value = e.detail.value
  form.bill_type = billTypeOptions[e.detail.value].value
}

function onSplitChange(e: any) {
  splitIndex.value = e.detail.value
  form.split_type = splitTypeOptions[e.detail.value].value
}

async function handleSubmit() {
  if (submitting.value) return
  if (!canSubmit.value) {
    if (form.split_type === 1) {
      const sum = selectedMembers.value.reduce((s, id) => s + (Number(memberAmounts[id]) || 0), 0)
      if (Math.abs(sum - Number(form.amount)) >= 0.01) {
        uni.showToast({ title: '分摊金额与总金额不一致', icon: 'none' })
      }
    }
    if (form.split_type === 2) {
      const sum = selectedMembers.value.reduce((s, id) => s + (Number(memberRatios[id]) || 0), 0)
      if (Math.abs(sum - 100) >= 0.01) {
        uni.showToast({ title: '百分比总和需等于100%', icon: 'none' })
      }
    }
    return
  }
  submitting.value = true
  const roomId = roomStore.currentRoom?.id
  if (!roomId) return

  const splitMembers = selectedMembers.value.map(id => {
    const item: { user_id: number; amount?: number; ratio?: number } = { user_id: id }
    if (form.split_type === 1) {
      item.amount = Number(memberAmounts[id])
    } else if (form.split_type === 2) {
      item.ratio = Number(memberRatios[id])
    }
    return item
  })

  try {
    await createBill({
      room_id: roomId,
      title: autoTitle.value,
      amount: Number(form.amount),
      bill_type: form.bill_type,
      split_type: form.split_type,
      remark: form.remark,
      split_members: splitMembers,
    })
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch { /* handled */ } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.create-bill-page {
  min-height: 100vh;
  background: $bg-page;
}

/* 自定义导航 */
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: $bg-card;
  border-bottom: 1rpx solid $border-light;
  padding-top: var(--status-bar-height, 0px);
}

.nav-inner {
  height: 88rpx;
  padding: 0 $space-2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-back,
.nav-placeholder {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
}

.nav-back {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:active {
    background: $bg-hover;
  }

  &__chevron {
    width: 18rpx;
    height: 18rpx;
    border-left: 4rpx solid $text-primary;
    border-bottom: 4rpx solid $text-primary;
    transform: translateX(4rpx) rotate(45deg);
  }
}

.nav-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
  line-height: 1;
}

.form-body {
  padding-top: $space-3;
}

/* 金额 */
.amount-panel {
  margin: 0 $page-gutter;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.amount-label {
  font-size: $font-xs;
  color: $text-secondary;
  line-height: 1.4;
}

.amount-wrap {
  display: flex;
  align-items: center;
  gap: $space-2;
  height: 112rpx;
  border-bottom: 2rpx solid $border-color;
  transition: $transition-fast;

  &.is-focused {
    border-bottom-color: $primary;
  }
}

.amount-prefix {
  flex-shrink: 0;
  font-family: $font-num;
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1;
  color: $text-primary;
}

.amount-input {
  flex: 1;
  min-width: 0;
  height: 112rpx;
  font-family: $font-num;
  font-size: 64rpx;
  font-weight: 700;
  color: $text-primary;
  caret-color: $primary;
}

.amount-clear {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: $text-hint;
  display: flex;
  align-items: center;
  justify-content: center;

  &__x {
    position: relative;
    width: 16rpx;
    height: 16rpx;

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 3rpx;
      margin-top: -1.5rpx;
      background: $bg-card;
    }

    &::before { transform: rotate(45deg); }
    &::after { transform: rotate(-45deg); }
  }
}

.split-hint {
  display: block;
  padding: $space-2 0 $space-3;
  font-size: $font-xs;
  color: $text-hint;
  line-height: 1.5;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: $page-gutter;
}

.label-count {
  color: $text-secondary;
  font-weight: 500;
}

.label-action {
  font-size: $font-xs;
  font-weight: 600;
  color: $primary;
  padding: 8rpx 0;
}

/* 成员 */
.member-item {
  display: flex;
  align-items: center;
  gap: $space-2;
  min-height: 112rpx;
  border-bottom: 1rpx solid $border-light;

  &:last-child {
    border-bottom: none;
  }
}

.member-check {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid $border-color;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-fast;

  &.is-on {
    background: $primary;
    border-color: $primary;
  }

  &__mark {
    width: 16rpx;
    height: 9rpx;
    border-left: 3rpx solid $bg-card;
    border-bottom: 3rpx solid $bg-card;
    transform: translateY(-2rpx) rotate(-45deg);
  }
}

.member-avatar {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $primary;

  &-text {
    font-size: $font-sm;
    font-weight: 600;
    line-height: 1;
    color: $text-white;
  }

  &.avatar-purple { background: #2563EB; }
  &.avatar-green { background: #12A150; }
  &.avatar-amber { background: #D97706; }
  &.avatar-blue { background: #0EA5E9; }
  &.avatar-rose { background: #E5484D; }
  &.avatar-teal { background: #0D9488; }
}

.member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.member-name {
  font-size: $font-sm;
  font-weight: 500;
  color: $text-primary;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-amount {
  font-size: $font-xs;
  color: $primary;
  font-weight: 600;
  line-height: 1.3;
}

.split-box {
  flex-shrink: 0;
  width: 200rpx;
  height: 72rpx;
  padding: 0 $space-2;
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: $bg-subtle;
  border: 1rpx solid $border-color;
  border-radius: $radius-sm;
  box-sizing: border-box;

  &__affix {
    flex-shrink: 0;
    font-size: $font-sm;
    color: $text-secondary;
    line-height: 1;
  }

  &__input {
    flex: 1;
    min-width: 0;
    height: 72rpx;
    font-family: $font-num;
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
    text-align: right;
    caret-color: $primary;
  }
}

.member-empty {
  padding: $space-5 0;
  text-align: center;
  font-size: $font-sm;
  color: $text-hint;
}

.warn-bar {
  margin: $space-3 $page-gutter 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: $warning-bg;
}

.warn-bar-text {
  font-size: $font-xs;
  color: $warning;
  line-height: 1.5;
}

.remark-textarea {
  height: 160rpx;
}

/* 底部栏 */
.bar-summary {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4rpx;

  &__amount {
    font-size: $font-md;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }

  &__sub {
    font-size: 22rpx;
    color: $text-hint;
    line-height: 1.3;
  }
}

.bar-btn {
  flex: none;
  width: 300rpx;
}
</style>

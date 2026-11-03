<template>
  <view class="create-bill-page">
    <!-- 顶部绿色渐变头部 -->
    <view class="page-header">
      <view class="header-inner">
        <view class="header-back" @click="handleBack">
          <image class="header-back-icon" src="/static/icons/chevron-right.png" mode="aspectFit" />
        </view>
        <view class="header-title-group">
          <text class="header-title">记一笔账</text>
          <text class="header-subtitle">{{ autoTitle }}</text>
        </view>
      </view>
    </view>

    <!-- 可滚动表单区域 -->
    <scroll-view class="form-scroll" scroll-y>
      <!-- ===== 1. 金额输入（大号展示 + 快捷金额） ===== -->
      <view class="card amount-card">
        <view class="amount-input-wrap" :class="{ 'is-focused': amountFocused }">
          <text class="amount-prefix">¥</text>
          <input
            v-model="form.amount"
            class="amount-input"
            type="digit"
            placeholder="0.00"
            maxlength="10"
            @focus="amountFocused = true"
            @blur="amountFocused = false"
          />
          <view v-if="form.amount && Number(form.amount) > 0" class="amount-suffix" @click="form.amount = ''">
            <text class="amount-clear">✕</text>
          </view>
        </view>
      </view>

      <!-- ===== 2. 分摊设置 ===== -->
      <view class="card settings-card">
        <view class="settings-row">
          <text class="settings-label">消费类型</text>
          <picker :range="billTypeOptions" :range-key="'label'" :value="typeIndex" @change="onTypeChange">
            <view class="settings-picker">
              <text class="settings-picker-value">{{ billTypeOptions[typeIndex].label }}</text>
              <image class="settings-arrow" src="/static/icons/chevron-right.png" mode="aspectFit" />
            </view>
          </picker>
        </view>
        <view class="settings-divider"></view>
        <view class="settings-row">
          <text class="settings-label">分摊方式</text>
          <picker :range="splitTypeOptions" :range-key="'label'" :value="splitIndex" @change="onSplitChange">
            <view class="settings-picker">
              <text class="settings-picker-value">{{ splitTypeOptions[splitIndex].label }}</text>
              <image class="settings-arrow" src="/static/icons/chevron-right.png" mode="aspectFit" />
            </view>
          </picker>
        </view>
        <view class="settings-hint">
          <text>{{ splitTypeHint }}</text>
        </view>
      </view>

      <!-- ===== 3. 成员选择（金额直接显示在列表中） ===== -->
      <view class="card member-card">
        <view class="member-header">
          <view class="member-header-left">
            <text class="member-title">成员分摊</text>
            <text class="member-count-badge" v-if="selectedMembers.length > 0">
              已选 {{ selectedMembers.length }}
            </text>
          </view>
          <view
            v-if="selectedMembers.length < members.length"
            class="select-all-btn"
            @click="selectAll"
          >
            <text class="select-all-text">全选</text>
          </view>
          <view v-else class="select-all-btn is-active" @click="deselectAll">
            <text class="select-all-text">取消全选</text>
          </view>
        </view>

        <view class="member-list">
          <view
            v-for="member in members"
            :key="member.user_id"
            class="member-item"
            :class="{ 'is-selected': isSelected(member.user_id) }"
            @click="toggleMember(member.user_id)"
          >
            <view class="member-left">
              <view class="member-avatar" :class="getAvatarColorClass(member.user_id)">
                <text class="member-avatar-text">{{ getAvatarText(member) }}</text>
              </view>
              <view class="member-info">
                <text class="member-name">{{ member.nickname || `用户 #${member.user_id}` }}</text>
                <text v-if="isSelected(member.user_id) && form.amount && Number(form.amount) > 0" class="member-amount-hint">
                  ¥{{ getMemberAmount(member.user_id) }}
                </text>
              </view>
            </view>

            <view class="member-right" @click.stop>
              <view v-if="isSelected(member.user_id) && form.split_type === 1" class="split-input-group">
                <text class="split-input-prefix">¥</text>
                <input
                  v-model="memberAmounts[member.user_id]"
                  class="split-input"
                  type="digit"
                  placeholder="0.00"
                />
              </view>
              <view v-else-if="isSelected(member.user_id) && form.split_type === 2" class="split-input-group">
                <input
                  v-model="memberRatios[member.user_id]"
                  class="split-input"
                  type="digit"
                  placeholder="0"
                />
                <text class="split-input-suffix">%</text>
              </view>
              <view class="member-check">
                <view class="check-circle" :class="{ 'is-checked': isSelected(member.user_id) }">
                  <text v-if="isSelected(member.user_id)" class="check-mark">✓</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="members.length === 0" class="member-empty">
          <text class="member-empty-text">暂无宿舍成员</text>
        </view>
      </view>

      <!-- ===== 4. 校验警告（合并到一处） ===== -->
      <view v-if="form.amount && Number(form.amount) > 0 && selectedMembers.length > 0 && form.split_type === 1 && !isCustomAmountValid" class="warn-bar">
        <text class="warn-bar-text">分摊金额合计 ¥{{ currentTotalAmount.toFixed(2) }}，需等于 ¥{{ Number(form.amount).toFixed(2) }}</text>
      </view>
      <view v-if="form.amount && Number(form.amount) > 0 && selectedMembers.length > 0 && form.split_type === 2 && !isPercentageValid" class="warn-bar">
        <text class="warn-bar-text">百分比合计 {{ currentTotalPercent.toFixed(1) }}%，需等于 100%</text>
      </view>

      <!-- ===== 5. 备注（折叠） ===== -->
      <view class="card remark-card">
        <view class="remark-header" @click="showRemark = !showRemark">
          <view class="remark-header-left">
            <text class="remark-title">备注</text>
            <text class="remark-hint">选填</text>
          </view>
          <view class="remark-toggle" :class="{ 'is-expanded': showRemark }">
            <text class="remark-toggle-icon">▼</text>
          </view>
        </view>
        <textarea
          v-if="showRemark"
          v-model="form.remark"
          class="remark-textarea"
          placeholder="如：已付给房东、包含水费..."
          maxlength="200"
        />
      </view>

      <view class="bottom-spacer"></view>
      <view class="bottom-safe"></view>
    </scroll-view>

    <!-- ===== 底部固定创建按钮 ===== -->
    <view class="bottom-bar">
      <button
        class="btn-create"
        :disabled="!canSubmit || submitting"
        :class="{ 'is-loading': submitting }"
        @click="handleSubmit"
      >
        <view v-if="!submitting" class="btn-create-inner">
          <text class="btn-create-text">确认创建</text>
        </view>
        <view v-else class="loading-spinner"></view>
      </button>
      <view class="bottom-summary" v-if="form.amount && Number(form.amount) > 0">
        <text class="bottom-summary-amount">¥{{ Number(form.amount).toFixed(2) }}</text>
        <text class="bottom-summary-sep">·</text>
        <text class="bottom-summary-members">{{ selectedMembers.length }} 人分摊</text>
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: $bg-page;
}

.page-header {
  flex-shrink: 0;
  background: linear-gradient(135deg, #EFFBF6, #E6FFFA);
  border-bottom: 1rpx solid rgba($success, 0.06);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: calc(var(--status-bar-height) + 20rpx) $space-4 $space-4;
}

.header-back {
  width: 64rpx;
  height: 64rpx;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba($text-white, 0.7);
  flex-shrink: 0;
  transition: $transition-fast;
  &:active { background-color: $bg-hover; }
}

.header-back-icon {
  width: 32rpx;
  height: 32rpx;
  transform: rotate(180deg);
}

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.header-title {
  font-size: 40rpx;
  font-weight: 800;
  color: $text-primary;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.header-subtitle {
  font-size: $font-xs;
  color: $text-hint;
  font-weight: 500;
}

.form-scroll {
  flex: 1;
  padding: $space-4 $space-4 0;
  box-sizing: border-box;
}

.card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  margin-bottom: $space-4;
  box-shadow: $shadow-sm;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: $success;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }
}

// ===== 1. 金额输入 + 快捷金额 =====
.amount-card {
  padding: $space-5 $space-5 $space-4;
  text-align: center;
}

.amount-input-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120rpx;
  padding: $space-4 $space-6;
  border: 3rpx solid $border-color;
  border-radius: $radius-xl;
  transition: $transition-base;
  background-color: $bg-hover;
  box-sizing: border-box;

  &.is-focused {
    border-color: $success;
    background-color: $bg-card;
    box-shadow: 0 0 0 6rpx rgba($success, 0.1);
  }

  .amount-prefix {
    font-size: 44rpx;
    font-weight: 800;
    color: $success;
    margin-right: $space-2;
    line-height: 1.2;
    flex-shrink: 0;
  }

  .amount-input {
    font-size: 52rpx;
    font-weight: 800;
    color: $text-primary;
    border: none;
    padding: 0;
    margin: 0;
    background: none;
    flex: 1;
    min-width: 0;
    height: 72rpx;
    line-height: 72rpx;
    text-align: center;
    box-sizing: border-box;
    &::placeholder {
      color: $border-color;
      font-weight: 600;
    }
  }

  .amount-suffix {
    flex-shrink: 0;
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background-color: $border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    &:active { background-color: $text-hint; }
    .amount-clear {
      font-size: 24rpx;
      color: $bg-card;
      font-weight: 700;
    }
  }
}

// ===== 2. 分摊设置 =====
.settings-card {
  padding: $space-3 $space-5;
}

.settings-divider {
  height: 1rpx;
  background-color: $border-light;
  margin: 0;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 0;
}

.settings-label {
  font-size: $font-base;
  color: $text-primary;
  font-weight: 500;
}

.settings-picker {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  background-color: $bg-hover;
  border-radius: $radius-sm;
  &:active { opacity: 0.7; }
  .settings-picker-value {
    font-size: $font-base;
    color: $primary;
    font-weight: 600;
  }
  .settings-arrow {
    width: 24rpx;
    height: 24rpx;
    opacity: 0.4;
  }
}

.settings-hint {
  padding: $space-2 0 $space-1;
  text {
    font-size: $font-xs;
    color: $text-hint;
    line-height: 1.5;
  }
}

// ===== 3. 成员选择 =====
.member-card {
  padding: $space-4 $space-4;
}

.member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
  padding: 0 $space-1;
}

.member-header-left {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.member-title {
  font-size: $font-base;
  font-weight: 700;
  color: $text-primary;
}

.member-count-badge {
  font-size: $font-xs;
  color: $primary;
  background-color: $primary-bg;
  padding: $space-1 $space-3;
  border-radius: $radius-full;
  font-weight: 600;
}

.select-all-btn {
  padding: $space-1 $space-4;
  border-radius: $radius-full;
  border: 2rpx solid $primary;
  transition: $transition-fast;
  &:active { opacity: 0.6; }
  &.is-active {
    background-color: $primary-bg;
    border-color: $primary;
  }
  .select-all-text {
    font-size: $font-xs;
    color: $primary;
    font-weight: 600;
  }
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-3;
  border: 2rpx solid $border-color;
  border-radius: $radius-lg;
  transition: $transition-fast;
  background-color: $bg-card;

  &.is-selected {
    border-color: $primary;
    background-color: $primary-bg;
  }

  .member-left {
    display: flex;
    align-items: center;
    gap: $space-3;
    flex: 1;
    min-width: 0;
  }

  .member-avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-weight: 700;
    color: $text-white;
    font-size: $font-base;

    &.avatar-purple { background: linear-gradient(135deg, #2F7CF6, #5B9BFF); }
    &.avatar-green { background: linear-gradient(135deg, #14B88A, #4FD1A5); }
    &.avatar-amber { background: linear-gradient(135deg, #FF9F2E, #FFC83D); }
    &.avatar-blue { background: linear-gradient(135deg, #22A6F2, #5CC2FF); }
    &.avatar-rose { background: linear-gradient(135deg, #FF6B8B, #FF9AAE); }
    &.avatar-teal { background: linear-gradient(135deg, #12B5A5, #3DD6C4); }
  }

  .member-avatar-text {
    font-size: 28rpx;
    font-weight: 700;
    color: $text-white;
  }

  .member-info {
    flex: 1;
    min-width: 0;
  }

  .member-name {
    font-size: $font-base;
    color: $text-primary;
    font-weight: 600;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .member-amount-hint {
    font-size: $font-xs;
    color: $success;
    margin-top: $space-1;
    display: block;
    font-weight: 600;
  }

  .member-right {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .split-input-group {
    display: flex;
    align-items: center;
    border: 2rpx solid $primary;
    border-radius: $radius-sm;
    overflow: hidden;
    background-color: $bg-card;
  }

  .split-input-prefix {
    font-size: $font-sm;
    color: $primary;
    font-weight: 600;
    padding: 0 $space-1 0 $space-2;
  }

  .split-input {
    width: 120rpx;
    height: 56rpx;
    padding: 0 $space-1;
    font-size: $font-base;
    text-align: center;
    border: none;
    background: none;
    color: $primary;
    font-weight: 600;
  }

  .split-input-suffix {
    font-size: $font-sm;
    color: $primary;
    font-weight: 600;
    padding: 0 $space-2 0 $space-1;
  }

  .member-check {
    margin-left: $space-2;
  }

  .check-circle {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    border: 3rpx solid $border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: $transition-fast;

    &.is-checked {
      background-color: $primary;
      border-color: $primary;
      box-shadow: 0 2rpx 8rpx rgba($primary, 0.3);
    }

    .check-mark {
      font-size: 24rpx;
      color: $text-white;
      font-weight: 700;
      line-height: 1;
    }
  }
}

.member-empty {
  padding: $space-8 0;
  text-align: center;
  .member-empty-text {
    font-size: $font-sm;
    color: $text-hint;
  }
}

// ===== 4. 校验警告 =====
.warn-bar {
  padding: $space-3 $space-4;
  background-color: $warning-bg;
  border-radius: $radius-md;
  margin-bottom: $space-4;
}

.warn-bar-text {
  font-size: $font-xs;
  color: $warning;
  line-height: 1.5;
}

// ===== 5. 备注 =====
.remark-card {
  padding: $space-3 $space-5;
}

.remark-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-2 0;
  cursor: pointer;
  &:active { opacity: 0.7; }
}

.remark-header-left {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.remark-title {
  font-size: $font-base;
  color: $text-primary;
  font-weight: 600;
}

.remark-hint {
  font-size: $font-xs;
  color: $text-hint;
  font-weight: 400;
}

.remark-toggle {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background-color: $bg-hover;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;

  &.is-expanded {
    transform: rotate(180deg);
    background-color: $primary-bg;
  }

  .remark-toggle-icon {
    font-size: 20rpx;
    color: $text-hint;
    line-height: 1;
  }
}

.remark-textarea {
  width: 100%;
  height: 140rpx;
  padding: $space-3 $space-4;
  font-size: $font-sm;
  color: $text-primary;
  border: 2rpx solid $border-color;
  border-radius: $radius-md;
  background-color: $bg-hover;
  transition: $transition-base;
  box-sizing: border-box;
  margin-top: $space-3;

  &:focus {
    border-color: $primary;
    background-color: $bg-card;
  }

  &::placeholder {
    color: $text-hint;
  }
}

.bottom-spacer {
  height: 260rpx;
}

.bottom-safe {
  height: 40rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: $space-3 $space-4;
  padding-bottom: calc($space-3 + constant(safe-area-inset-bottom));
  padding-bottom: calc($space-3 + env(safe-area-inset-bottom));
  background: linear-gradient(transparent, $bg-page 20%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
}

.btn-create {
  width: 100%;
  height: 100rpx;
  border-radius: $radius-xl;
  background: $primary-gradient;
  box-shadow: 0 8rpx 32rpx rgba(47, 124, 246, 0.35);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;

  &:active { opacity: 0.85; }

  &[disabled] {
    opacity: 0.5;
    transform: none;
    box-shadow: none;
  }

  &.is-loading { opacity: 0.8; }
}

.btn-create-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-create-text {
  font-size: $font-base;
  font-weight: 700;
  color: $text-white;
  letter-spacing: 0.02em;
}

.bottom-summary {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-1 0;
}

.bottom-summary-amount {
  font-size: $font-sm;
  color: $text-primary;
  font-weight: 600;
}

.bottom-summary-sep {
  font-size: $font-sm;
  color: $text-hint;
}

.bottom-summary-members {
  font-size: $font-xs;
  color: $text-hint;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid rgba($text-white, 0.3);
  border-top-color: $text-white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

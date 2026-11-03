<template>
  <view class="page">
    <view class="form-body">
      <view class="task-input-area">
        <view class="field-title">
          <view class="title-row">
            <text class="title-label">任务标题</text>
            <text class="title-count">{{ form.title.length }}/12</text>
          </view>
          <input v-model="form.title" class="input-title" placeholder="" maxlength="12" />
        </view>

        <view class="field-desc">
          <textarea v-model="form.description" class="input-desc" placeholder="描述一下任务的具体要求..." maxlength="500" />
          <text class="desc-count">{{ form.description.length }}/500</text>
        </view>
      </view>

      <view class="section-line">
        <text class="section-label">执行人</text>
        <text class="section-count">{{ selectedExecutorIds.length }}人</text>
      </view>

      <view v-if="members.length > 0" class="member-list">
        <view
          v-for="m in members"
          :key="m.user_id"
          class="member-row"
          :class="{ active: selectedExecutorIds.includes(m.user_id) }"
          @click="toggleExecutor(m.user_id)"
        >
          <view class="member-avatar" :style="{ background: getAvatarColor(m.nickname) }">
            <text class="avatar-letter">{{ m.nickname.charAt(0) }}</text>
          </view>
          <view class="member-info">
            <text class="member-name">{{ m.nickname }}</text>
          </view>
          <view class="member-check" :class="{ checked: selectedExecutorIds.includes(m.user_id) }">
            <text v-if="selectedExecutorIds.includes(m.user_id)" class="check-icon">✓</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-text">暂无成员</view>

      <view class="section-line">
        <text class="section-label">优先级</text>
      </view>

      <view class="priority-row">
        <view
          v-for="opt in priorityOptions"
          :key="opt.value"
          class="priority-tag"
          :class="{ active: form.priority === opt.value }"
          :style="form.priority === opt.value ? { borderColor: opt.color, color: opt.color } : {}"
          @click="form.priority = opt.value"
        >
          <view class="priority-dot" :style="{ backgroundColor: opt.color }"></view>
          <text>{{ opt.label }}</text>
        </view>
      </view>

      <picker mode="multiSelector" :range="dateTimeRange" :value="dateTimeValue" @change="onDeadlineChange">
        <view class="row-line">
          <text class="row-label">截止时间</text>
          <view class="row-value">
            <text>{{ deadlineText }}</text>
            <text class="row-arrow">›</text>
          </view>
        </view>
      </picker>

      <view class="row-line">
        <text class="row-label">周期任务</text>
        <switch :checked="form.is_cycle" @change="form.is_cycle = $event.detail.value" color="#6366F1" />
      </view>

      <template v-if="form.is_cycle">
        <picker :range="cycleTypes" :range-key="'label'" :value="cycleIndex" @change="onCycleChange">
          <view class="row-line row-line-sub">
            <text class="row-label-sub">重复频率</text>
            <view class="row-value">
              <text>{{ cycleTypes[cycleIndex].label }}</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
        </picker>
        <picker v-if="cycleTypes[cycleIndex].value === 'monthly'" :range="dayOfMonthRange" :value="dayOfMonthIndex" @change="onDayOfMonthChange">
          <view class="row-line row-line-sub">
            <text class="row-label-sub">每月几号</text>
            <view class="row-value">
              <text>{{ dayOfMonthRange[dayOfMonthIndex] }} 号</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
        </picker>
        <view class="row-line row-line-sub">
          <text class="row-label-sub">结束时间</text>
          <switch :checked="hasCycleEnd" @change="hasCycleEnd = $event.detail.value" color="#6366F1" />
        </view>
        <picker v-if="hasCycleEnd" mode="date" :value="cycleEndDate" @change="onCycleEndDateChange">
          <view class="row-line row-line-sub">
            <text class="row-label-sub">结束日期</text>
            <view class="row-value">
              <text>{{ cycleEndDate || '请选择' }}</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
        </picker>
      </template>
    </view>

    <view class="footer">
      <button class="btn-submit" :class="{ loading: submitting }" :disabled="!canSubmit" @click="handleSubmit">
        {{ submitting ? '发布中...' : (isEdit ? '更新任务' : '创建任务') }}
      </button>
      <text class="footer-hint">创建后将通知所有执行人</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRoomStore } from '@/stores/room'
import { createTask, updateTask, getTaskDetail } from '@/api/task'
import { getMembers } from '@/api/room'
import { PRIORITY_OPTIONS } from '@/constants/task'
import type { Member } from '@/types/room'

const roomStore = useRoomStore()
const members = ref<Member[]>([])
const selectedExecutorIds = ref<number[]>([])
const priorityOptions = PRIORITY_OPTIONS
const submitting = ref(false)
const editTaskId = ref<number | null>(null)
const cycleTypes = [
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
]
const cycleIndex = ref(0)
const dayOfMonthRange = Array.from({ length: 28 }, (_, i) => i + 1)
const dayOfMonthIndex = ref(4)
const hasCycleEnd = ref(false)
const cycleEndDate = ref('')

const now = new Date()
const currentYear = now.getFullYear()
const dateTimeRange = [
  [String(currentYear), String(currentYear + 1)],
  ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  Array.from({ length: 31 }, (_, i) => `${i + 1}日`),
  Array.from({ length: 24 }, (_, i) => `${i}时`),
  ['00分', '15分', '30分', '45分']
]
const dateTimeValue = ref([0, now.getMonth(), now.getDate() - 1, 18, 0])
const deadlineText = computed(() => {
  const [yi, mi, di, hi, mni] = dateTimeValue.value
  const y = dateTimeRange[0][yi]
  const m = dateTimeRange[1][mi]
  const d = dateTimeRange[2][di]
  const h = dateTimeRange[3][hi]
  const mn = dateTimeRange[4][mni]
  return `${y}-${m}-${d} ${h}:${mn}`
})

const form = reactive({
  title: '',
  description: '',
  priority: 0,
  is_cycle: false,
  cycle_rule: null as any,
})

const isEdit = computed(() => !!editTaskId.value)
const canSubmit = computed(() => form.title && selectedExecutorIds.value.length > 0)

onLoad((options) => {
  if (options?.id) {
    editTaskId.value = Number(options.id)
  }
})

onShow(async () => {
  const roomId = roomStore.currentRoom?.id
  if (roomId) {
    const res = await getMembers(roomId)
    members.value = res.data
  }
  if (editTaskId.value) {
    const res = await getTaskDetail(editTaskId.value)
    const task = res.data
    form.title = task.title
    form.description = task.description || ''
    form.priority = task.priority
    form.is_cycle = task.is_cycle
    form.cycle_rule = task.cycle_rule
    selectedExecutorIds.value = task.executors.map(e => e.user_id)
    if (task.cycle_rule) {
      const idx = cycleTypes.findIndex(c => c.value === task.cycle_rule?.type)
      if (idx >= 0) cycleIndex.value = idx
      if (task.cycle_rule.day_of_month) {
        dayOfMonthIndex.value = task.cycle_rule.day_of_month - 1
      }
    }
    if (task.cycle_end_date) {
      hasCycleEnd.value = true
      cycleEndDate.value = task.cycle_end_date.slice(0, 10)
    }
    if (task.deadline) {
      const d = new Date(task.deadline)
      const yearIdx = d.getFullYear() - currentYear
      const monthIdx = d.getMonth()
      const dayIdx = d.getDate() - 1
      const hourIdx = d.getHours()
      const minuteIdx = [0, 15, 30, 45].indexOf(d.getMinutes())
      if (yearIdx >= 0) dateTimeValue.value = [yearIdx, monthIdx, dayIdx, hourIdx, minuteIdx >= 0 ? minuteIdx : 0]
    }
  }
})

function toggleExecutor(userId: number) {
  const idx = selectedExecutorIds.value.indexOf(userId)
  if (idx >= 0) {
    selectedExecutorIds.value.splice(idx, 1)
  } else {
    selectedExecutorIds.value.push(userId)
  }
}

const avatarColors = ['#6366F1', '#14B8A6', '#F59E0B', '#F43F5E', '#0EA5E9', '#8B5CF6', '#10B981', '#EF4444']
function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}
function onDeadlineChange(e: any) {
  dateTimeValue.value = e.detail.value
}
function onCycleChange(e: any) {
  cycleIndex.value = e.detail.value
  const type = cycleTypes[e.detail.value].value
  form.cycle_rule = { type, time: '08:00' }
  if (type === 'monthly') {
    form.cycle_rule.day_of_month = dayOfMonthRange[dayOfMonthIndex.value]
  }
}
function onDayOfMonthChange(e: any) {
  dayOfMonthIndex.value = e.detail.value
  if (form.cycle_rule) {
    form.cycle_rule.day_of_month = dayOfMonthRange[e.detail.value]
  }
}
function onCycleEndDateChange(e: any) {
  cycleEndDate.value = e.detail.value
}

async function handleSubmit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  const roomId = roomStore.currentRoom?.id
  if (!roomId) return
  try {
    const [yi, mi, di, hi, mni] = dateTimeValue.value
    const year = dateTimeRange[0][yi]
    const month = String(mi + 1).padStart(2, '0')
    const day = String(di + 1).padStart(2, '0')
    const hour = String(hi).padStart(2, '0')
    const minute = mni === 0 ? '00' : mni === 1 ? '15' : mni === 2 ? '30' : '45'
    const deadline = `${year}-${month}-${day} ${hour}:${minute}:00`

    const data: any = {
      room_id: roomId,
      title: form.title,
      description: form.description,
      execute_user_ids: selectedExecutorIds.value,
      priority: form.priority,
      deadline,
      is_cycle: form.is_cycle,
      cycle_rule: form.is_cycle ? form.cycle_rule : null,
      cycle_end_date: form.is_cycle && hasCycleEnd.value && cycleEndDate.value ? `${cycleEndDate.value} 23:59:59` : null,
    }

    if (editTaskId.value) {
      await updateTask(editTaskId.value, data)
      uni.showToast({ title: '已重新发布', icon: 'success' })
    } else {
      await createTask(data)
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    setTimeout(() => uni.navigateBack(), 1500)
  } catch { /* handled */ } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page {
  min-height: 100vh;
  background: $bg-page;
}

.form-body {
  padding: $space-4 $space-4 0;
}

/* ---------- 标题 ---------- */
.task-input-area {
  background: linear-gradient(135deg, #F8F7FF 0%, #F0F0FF 100%);
  border-radius: $radius-xl;
  padding: $space-4;
  margin-bottom: $space-4;
  border: 1rpx solid rgba($primary, 0.08);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: $primary;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }
}

.field-title {
  margin-bottom: $space-3;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-1;
}

.title-label {
  font-size: $font-xs;
  color: $primary;
  font-weight: 600;
}

.title-count {
  font-size: 20rpx;
  color: $text-hint;
}

.input-title {
  width: 100%;
  height: 80rpx;
  font-size: $font-base;
  font-weight: 600;
  color: $text-primary;
  border: 2rpx solid $border-color;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.8);
  padding: 0 $space-4;
  margin: 0;
  box-sizing: border-box;
  transition: $transition-fast;

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 4rpx $primary-bg;
  }
}

/* ---------- 描述 ---------- */
.field-desc {
  position: relative;
  border: 2rpx solid $border-color;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.8);
  transition: $transition-fast;

  &:focus-within {
    border-color: $primary;
    box-shadow: 0 0 0 4rpx $primary-bg;
  }
}

.input-desc {
  width: 100%;
  min-height: 100rpx;
  font-size: $font-sm;
  color: $text-primary;
  border: none;
  background: transparent;
  line-height: 1.6;
  resize: none;
  padding: $space-3;

  &::placeholder {
    color: rgba($text-hint, 0.35);
  }
}

.desc-count {
  position: absolute;
  bottom: $space-2;
  right: $space-3;
  font-size: 20rpx;
  color: $text-hint;
}

/* ---------- 分段标题 ---------- */
.section-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 0;
}

.section-label {
  font-size: $font-xs;
  color: $text-hint;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.section-count {
  font-size: $font-xs;
  color: $primary;
  font-weight: 600;
}

/* ---------- 成员列表 ---------- */
.member-list {
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  margin-bottom: $space-3;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-color;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: $primary;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }
}

.member-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-bottom: 1rpx solid $border-light;
  transition: $transition-fast;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: $bg-hover;
  }
}

.member-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-letter {
  font-size: 20rpx;
  font-weight: 700;
  color: $text-white;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: $font-sm;
  font-weight: 500;
  color: $text-primary;
}

.member-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: $transition-fast;

  &.checked {
    border-color: $primary;
    background: $primary;
  }
}

.check-icon {
  font-size: 20rpx;
  color: $text-white;
  font-weight: 700;
}

.empty-text {
  font-size: $font-sm;
  color: $text-hint;
  padding: $space-4 0;
  text-align: center;
}

/* ---------- 优先级 ---------- */
.priority-row {
  display: flex;
  gap: $space-2;
  padding: $space-2 0 $space-4;
}

.priority-tag {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  height: 72rpx;
  border: 2rpx solid $border-color;
  border-radius: $radius-lg;
  font-size: $font-xs;
  color: $text-secondary;
  transition: $transition-fast;
  background: $bg-card;
  position: relative;
  overflow: hidden;

  &:active {
    transform: scale(0.97);
  }

  &.active {
    background: $bg-card;
    font-weight: 600;
    box-shadow: $shadow-sm;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6rpx;
      background: currentColor;
      opacity: 0.4;
      border-radius: 0 $radius-sm $radius-sm 0;
    }
  }
}

.priority-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ---------- 行项 ---------- */
.row-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 0;
  border-bottom: 1rpx solid $border-light;
}

.row-line-sub {
  padding-left: $space-4;
}

.row-label {
  font-size: $font-sm;
  color: $text-primary;
  font-weight: 500;
}

.row-label-sub {
  font-size: $font-xs;
  color: $text-secondary;
}

.row-value {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $font-sm;
  color: $text-primary;
}

.row-arrow {
  font-size: 32rpx;
  color: $text-hint;
}

/* ---------- 底部 ---------- */
.footer {
  padding: $space-6 $space-4 $space-8;
}

.btn-submit {
  width: 100%;
  height: 96rpx;
  background: $primary-gradient;
  border: none;
  border-radius: $radius-xl;
  font-size: $font-base;
  font-weight: 700;
  color: $text-white;
  letter-spacing: 0.02em;
  box-shadow: 0 8rpx 32rpx rgba($primary, 0.3);
  transition: $transition-base;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;

  &.loading {
    opacity: 0.7;
  }

  &:disabled {
    opacity: 0.4;
    box-shadow: none;
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
    box-shadow: 0 4rpx 16rpx rgba($primary, 0.2);
  }
}

.footer-hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: $text-hint;
  margin-top: $space-3;
}
</style>

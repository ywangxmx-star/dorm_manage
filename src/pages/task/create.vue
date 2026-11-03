<template>
  <view class="page">
    <view class="intro">
      <text class="intro-title">{{ isEdit ? '改一改这个任务' : '新任务来啦' }}</text>
      <text class="intro-sub">分配给室友，到点自动提醒</text>
    </view>

    <text class="ui-form-label">做什么</text>
    <view class="ui-form-group">
      <view class="title-row">
        <input v-model="form.title" class="input-title" placeholder="比如：倒垃圾、拖地" maxlength="12" />
        <text class="count">{{ form.title.length }}/12</text>
      </view>
      <view class="desc-wrap">
        <textarea v-model="form.description" class="input-desc" placeholder="补充一下具体要求（选填）" maxlength="500" />
        <text class="count count--desc">{{ form.description.length }}/500</text>
      </view>
    </view>

    <view class="label-row">
      <text class="ui-form-label">谁来做</text>
      <text class="label-extra">已选 {{ selectedExecutorIds.length }} 人</text>
    </view>
    <view v-if="members.length > 0" class="member-grid">
      <view
        v-for="m in members"
        :key="m.user_id"
        class="member-chip"
        :class="{ 'is-active': selectedExecutorIds.includes(m.user_id) }"
        @click="toggleExecutor(m.user_id)"
      >
        <view class="member-avatar" :style="{ background: getAvatarColor(m.nickname) }">
          <text class="member-avatar-text">{{ m.nickname.charAt(0) }}</text>
          <view v-if="selectedExecutorIds.includes(m.user_id)" class="member-check">✓</view>
        </view>
        <text class="member-name">{{ m.nickname }}</text>
      </view>
    </view>
    <view v-else class="ui-form-group empty-text">暂无成员</view>

    <text class="ui-form-label">有多急</text>
    <view class="priority-row">
      <view
        v-for="opt in priorityOptions"
        :key="opt.value"
        class="priority-pill"
        :class="{ 'is-active': form.priority === opt.value }"
        :style="form.priority === opt.value ? { backgroundColor: opt.color, borderColor: opt.color } : {}"
        @click="form.priority = opt.value"
      >
        <view class="priority-dot" :style="{ backgroundColor: form.priority === opt.value ? '#FFFFFF' : opt.color }"></view>
        <text>{{ opt.label }}</text>
      </view>
    </view>

    <text class="ui-form-label">什么时候</text>
    <view class="ui-form-group">
      <picker mode="multiSelector" :range="dateTimeRange" :value="dateTimeValue" @change="onDeadlineChange">
        <view class="row">
          <text class="row-label">截止时间</text>
          <view class="row-value">
            <text>{{ deadlineText }}</text>
            <text class="row-arrow">›</text>
          </view>
        </view>
      </picker>
      <view class="row">
        <view class="row-label-group">
          <text class="row-label">周期任务</text>
          <text class="row-hint">适合值日、轮流打扫</text>
        </view>
        <switch :checked="form.is_cycle" @change="form.is_cycle = $event.detail.value" color="#2F7CF6" />
      </view>
      <template v-if="form.is_cycle">
        <picker :range="cycleTypes" :range-key="'label'" :value="cycleIndex" @change="onCycleChange">
          <view class="row row--sub">
            <text class="row-label">重复频率</text>
            <view class="row-value">
              <text>{{ cycleTypes[cycleIndex].label }}</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
        </picker>
        <picker v-if="cycleTypes[cycleIndex].value === 'monthly'" :range="dayOfMonthRange" :value="dayOfMonthIndex" @change="onDayOfMonthChange">
          <view class="row row--sub">
            <text class="row-label">每月几号</text>
            <view class="row-value">
              <text>{{ dayOfMonthRange[dayOfMonthIndex] }} 号</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
        </picker>
        <view class="row row--sub">
          <text class="row-label">设置结束时间</text>
          <switch :checked="hasCycleEnd" @change="hasCycleEnd = $event.detail.value" color="#2F7CF6" />
        </view>
        <picker v-if="hasCycleEnd" mode="date" :value="cycleEndDate" @change="onCycleEndDateChange">
          <view class="row row--sub">
            <text class="row-label">结束日期</text>
            <view class="row-value">
              <text>{{ cycleEndDate || '请选择' }}</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
        </picker>
      </template>
    </view>

    <view class="ui-bottom-spacer"></view>

    <view class="ui-bottom-bar bar">
      <text class="bar-hint">发布后将通知所有执行人</text>
      <view
        class="ui-btn ui-btn--primary bar-btn"
        :class="{ 'is-disabled': !canSubmit || submitting }"
        @click="handleSubmit"
      >
        {{ submitting ? '发布中...' : (isEdit ? '更新任务' : '发布任务') }}
      </view>
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

const avatarColors = ['#2F7CF6', '#12B5A5', '#FF9F2E', '#FF6B8B', '#22A6F2', '#FF7AB6', '#14B88A', '#FF5A5F']
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
  padding-top: $space-4;
}

.intro {
  padding: 0 $space-5 $space-2;
  display: flex;
  flex-direction: column;
  gap: 6rpx;

  &-title {
    font-size: 48rpx;
    font-weight: 900;
    color: $text-primary;
    letter-spacing: -0.02em;
  }

  &-sub {
    font-size: $font-sm;
    color: $text-secondary;
  }
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: $space-5;
}

.label-extra {
  font-size: $font-xs;
  font-weight: 700;
  color: $primary;
}

.title-row {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 0;
  border-bottom: 2rpx dashed $border-color;
}

.input-title {
  flex: 1;
  height: 88rpx;
  font-size: 40rpx;
  font-weight: 800;
  color: $text-primary;
}

.count {
  font-size: 22rpx;
  color: $text-hint;

  &--desc {
    display: block;
    text-align: right;
    padding-bottom: $space-2;
  }
}

.desc-wrap {
  padding-top: $space-2;
}

.input-desc {
  width: 100%;
  height: 160rpx;
  font-size: $font-sm;
  color: $text-primary;
  line-height: 1.6;
}

/* 执行人宫格 */
.member-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  padding: 0 $space-5 $space-4;
}

.member-chip {
  width: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: $space-3 0;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 3rpx solid $border-light;
  transition: $transition-fast;

  &.is-active {
    border-color: $primary;
    background: $primary-bg;
  }
}

.member-avatar {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &-text {
    font-size: $font-md;
    font-weight: 800;
    color: $text-white;
  }
}

.member-check {
  position: absolute;
  right: -8rpx;
  bottom: -8rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: $accent-lemon;
  border: 4rpx solid $bg-card;
  color: $text-primary;
  font-size: 20rpx;
  font-weight: 900;
  line-height: 36rpx;
  text-align: center;
}

.member-name {
  max-width: 120rpx;
  font-size: $font-xs;
  font-weight: 600;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-text {
  padding: $space-4;
  font-size: $font-sm;
  color: $text-hint;
  text-align: center;
}

/* 优先级 */
.priority-row {
  display: flex;
  gap: $space-2;
  padding: 0 $space-5 $space-4;
}

.priority-pill {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border-radius: $radius-full;
  background: $bg-card;
  border: 3rpx solid $border-color;
  font-size: $font-sm;
  font-weight: 700;
  color: $text-primary;

  &.is-active {
    color: $text-white;
  }
}

.priority-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

/* 设置行 */
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  min-height: 104rpx;
  border-bottom: 2rpx dashed $border-color;

  &:last-child {
    border-bottom: none;
  }

  &--sub {
    padding-left: $space-3;
  }
}

picker:last-child .row {
  border-bottom: none;
}

.row-label-group {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.row-label {
  font-size: $font-sm;
  font-weight: 700;
  color: $text-primary;
}

.row-hint {
  font-size: 22rpx;
  color: $text-hint;
}

.row-value {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: $font-sm;
  color: $text-secondary;
}

.row-arrow {
  font-size: $font-md;
  color: $text-hint;
}

/* 底栏 */
.bar {
  flex-direction: column;
  align-items: stretch;
  gap: $space-2;
}

.bar-hint {
  font-size: 22rpx;
  color: $text-hint;
  text-align: center;
}

.bar-btn {
  flex: none;
}
</style>

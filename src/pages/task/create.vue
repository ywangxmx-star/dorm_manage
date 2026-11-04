<template>
  <view class="ui-page">
    <view class="ui-header">
      <text class="ui-header__title">{{ isEdit ? '编辑任务' : '新建任务' }}</text>
      <text class="ui-header__sub">分配给室友，到点自动提醒</text>
    </view>

    <text class="ui-form-label">基本信息</text>
    <view class="ui-form-group">
      <view class="ui-field">
        <view class="ui-field__hd">
          <text class="ui-field__label">任务名称<text class="ui-field__required">*</text></text>
          <text class="ui-field__count">{{ form.title.length }}/12</text>
        </view>
        <input v-model="form.title" class="ui-input" placeholder="比如：倒垃圾、拖地" maxlength="12" />
      </view>
      <view class="ui-field">
        <view class="ui-field__hd">
          <text class="ui-field__label">任务说明</text>
          <text class="ui-field__count">{{ form.description.length }}/500</text>
        </view>
        <textarea v-model="form.description" class="ui-textarea" placeholder="补充一下具体要求（选填）" maxlength="500" />
      </view>
    </view>

    <view class="label-row">
      <text class="ui-form-label">执行人</text>
      <text class="label-extra">已选 {{ selectedExecutorIds.length }} 人</text>
    </view>
    <view class="ui-form-group member-group">
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
          </view>
          <text class="member-name">{{ m.nickname }}</text>
          <view class="member-check" :class="{ 'is-on': selectedExecutorIds.includes(m.user_id) }">
            <view class="member-check__mark"></view>
          </view>
        </view>
      </view>
      <view v-else class="empty-text">暂无成员</view>
    </view>

    <text class="ui-form-label">优先级</text>
    <view class="ui-form-group choice-group">
      <view class="ui-choice-row">
        <view
          v-for="opt in priorityOptions"
          :key="opt.value"
          class="ui-choice"
          :class="{ 'is-active': form.priority === opt.value }"
          @click="form.priority = opt.value"
        >
          <view class="priority-dot" :style="{ backgroundColor: opt.color }"></view>
          <text>{{ opt.label }}</text>
        </view>
      </view>
    </view>

    <text class="ui-form-label">时间设置</text>
    <view class="ui-form-group">
      <picker mode="multiSelector" :range="dateTimeRange" :value="dateTimeValue" @change="onDeadlineChange">
        <view class="ui-row">
          <text class="ui-row__label">截止时间</text>
          <view class="ui-row__value">
            <text class="num">{{ deadlineText }}</text>
            <view class="ui-row__arrow"></view>
          </view>
        </view>
      </picker>
      <view class="ui-row">
        <view class="ui-row__label-group">
          <text class="ui-row__label">周期任务</text>
          <text class="ui-row__hint">适合值日、轮流打扫</text>
        </view>
        <switch :checked="form.is_cycle" @change="form.is_cycle = $event.detail.value" color="#2563EB" />
      </view>
      <template v-if="form.is_cycle">
        <picker :range="cycleTypes" :range-key="'label'" :value="cycleIndex" @change="onCycleChange">
          <view class="ui-row ui-row--sub">
            <text class="ui-row__label">重复频率</text>
            <view class="ui-row__value">
              <text>{{ cycleTypes[cycleIndex].label }}</text>
              <view class="ui-row__arrow"></view>
            </view>
          </view>
        </picker>
        <picker v-if="cycleTypes[cycleIndex].value === 'monthly'" :range="dayOfMonthRange" :value="dayOfMonthIndex" @change="onDayOfMonthChange">
          <view class="ui-row ui-row--sub">
            <text class="ui-row__label">每月几号</text>
            <view class="ui-row__value">
              <text>{{ dayOfMonthRange[dayOfMonthIndex] }} 号</text>
              <view class="ui-row__arrow"></view>
            </view>
          </view>
        </picker>
        <view class="ui-row ui-row--sub">
          <text class="ui-row__label">设置结束时间</text>
          <switch :checked="hasCycleEnd" @change="hasCycleEnd = $event.detail.value" color="#2563EB" />
        </view>
        <picker v-if="hasCycleEnd" mode="date" :value="cycleEndDate" @change="onCycleEndDateChange">
          <view class="ui-row ui-row--sub">
            <text class="ui-row__label">结束日期</text>
            <view class="ui-row__value" :class="{ 'is-empty': !cycleEndDate }">
              <text>{{ cycleEndDate || '请选择' }}</text>
              <view class="ui-row__arrow"></view>
            </view>
          </view>
        </picker>
      </template>
    </view>

    <view class="ui-bottom-spacer"></view>

    <view class="ui-bottom-bar ui-bottom-bar--stack">
      <text class="ui-bottom-bar__hint">发布后将通知所有执行人</text>
      <view
        class="ui-btn ui-btn--primary"
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

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: $page-gutter;
}

.label-extra {
  font-size: $font-xs;
  font-weight: 500;
  color: $text-secondary;
}

.member-group,
.choice-group {
  padding-top: $space-4;
  padding-bottom: $space-4;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-2;
}

.member-chip {
  display: flex;
  align-items: center;
  gap: $space-2;
  height: 88rpx;
  padding: 0 $space-3 0 $space-2;
  border-radius: $radius-sm;
  background: $bg-card;
  border: 1rpx solid $border-color;
  box-sizing: border-box;
  transition: $transition-fast;

  &.is-active {
    border-color: $primary;
    background: $primary-bg;
  }
}

.member-avatar {
  flex-shrink: 0;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &-text {
    font-size: $font-sm;
    font-weight: 600;
    line-height: 1;
    color: $text-white;
  }
}

.member-name {
  flex: 1;
  min-width: 0;
  font-size: $font-sm;
  font-weight: 500;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-check {
  flex-shrink: 0;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid $border-color;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;

  &.is-on {
    background: $primary;
    border-color: $primary;
  }

  &__mark {
    width: 14rpx;
    height: 8rpx;
    border-left: 3rpx solid $bg-card;
    border-bottom: 3rpx solid $bg-card;
    transform: translateY(-2rpx) rotate(-45deg);
  }
}

.empty-text {
  padding: $space-3 0;
  font-size: $font-sm;
  color: $text-hint;
  text-align: center;
}

.priority-dot {
  flex-shrink: 0;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}
</style>

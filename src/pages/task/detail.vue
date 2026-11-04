<template>
  <view class="detail-page" v-if="task">
    <view class="ui-panel head">
      <view class="head-tags">
        <view class="status-tag" :style="{ color: statusInfo.color, backgroundColor: statusInfo.color + '14' }">
          <view class="status-tag__dot" :style="{ backgroundColor: statusInfo.color }"></view>
          <text>{{ statusInfo.text }}</text>
        </view>
        <view class="status-tag" :style="{ color: priorityColor, backgroundColor: priorityColor + '14' }">
          <text>{{ priorityText }}</text>
        </view>
      </view>
      <text class="head-title">{{ task.title }}</text>
      <text v-if="task.description" class="head-desc">{{ task.description }}</text>
      <view class="head-meta">
        <view class="head-meta__item">
          <text class="head-meta__lbl">截止时间</text>
          <text class="head-meta__val num">{{ formatDate(task.deadline) }}</text>
        </view>
        <view class="head-meta__divider"></view>
        <view class="head-meta__item">
          <text class="head-meta__lbl">创建时间</text>
          <text class="head-meta__val num">{{ formatDate(task.create_time) }}</text>
        </view>
      </view>
    </view>

    <view v-if="task.is_urged && isExecutor" class="notice notice--warn">
      <image class="notice__icon" src="/static/icons/bell.png" mode="aspectFit" />
      <text class="notice__text">宿舍长在催你啦，请尽快处理</text>
    </view>

    <view v-if="task.is_cycle && !task.parent_cycle_id" class="ui-panel">
      <view class="cycle">
        <view class="cycle-icon">
          <image class="cycle-icon-img" src="/static/icons/refresh.png" mode="aspectFit" />
        </view>
        <view class="cycle-info">
          <text class="cycle-title">周期任务 · {{ cycleText }}</text>
          <text v-if="task.cycle_end_date" class="cycle-hint">结束于 {{ formatDate(task.cycle_end_date) }}</text>
        </view>
      </view>
    </view>

    <view class="ui-panel">
      <view class="ui-panel__hd">
        <text class="ui-panel__title">执行人</text>
        <text class="panel-count">{{ task.executors?.length || 0 }} 人</text>
      </view>
      <view v-if="task.executors?.length" class="people">
        <view v-for="ex in task.executors" :key="ex.user_id" class="person">
          <view class="person-avatar">
            <text class="person-avatar-text">{{ (ex.nickname || '-').charAt(0) }}</text>
          </view>
          <text class="person-name">{{ ex.nickname }}</text>
          <text
            class="person-status"
            :style="{ color: ExecutorStatusMap[ex.status]?.color || '#94A3B8', backgroundColor: (ExecutorStatusMap[ex.status]?.color || '#94A3B8') + '14' }"
          >{{ ExecutorStatusMap[ex.status]?.text || '未知' }}</text>
        </view>
      </view>
      <text v-else class="panel-empty">暂未指定执行人</text>
    </view>

    <view v-if="finishRemark || finishImageUrls.length" class="ui-panel">
      <view class="ui-panel__hd">
        <text class="ui-panel__title">完成记录</text>
      </view>
      <text v-if="finishRemark" class="finish-remark">{{ finishRemark }}</text>
      <view v-if="finishImageUrls.length" class="finish-images">
        <view v-for="(url, idx) in finishImageUrls" :key="idx" class="finish-cell" @click="previewFinishImages(idx)">
          <image :src="url" class="finish-img" mode="aspectFill" />
        </view>
      </view>
    </view>

    <view v-if="statusHint" class="notice">
      <view class="notice__dot"></view>
      <text class="notice__text notice__text--sub">{{ statusHint }}</text>
    </view>

    <view v-if="isLeader && !canAudit && (canUrge || canStopCycle || canCancel || canDelete)" class="ui-panel">
      <view class="ui-panel__hd">
        <text class="ui-panel__title">管理操作</text>
      </view>
      <view class="tools">
        <view v-if="canUrge" class="tool" @click="handleUrge">催一下</view>
        <view v-if="canStopCycle" class="tool" @click="handleStopCycle">结束周期</view>
        <view v-if="canCancel" class="tool" @click="handleCancel">取消任务</view>
        <view v-if="canDelete" class="tool tool--danger" @click="handleDelete">删除任务</view>
      </view>
    </view>

    <view class="ui-bottom-spacer"></view>

    <view v-if="isPendingExecutor || canAudit || canComplete || canRepublish" class="ui-bottom-bar">
      <template v-if="isPendingExecutor">
        <view class="ui-btn ui-btn--ghost" @click="handleReject">拒绝</view>
        <view class="ui-btn ui-btn--primary bar-main" @click="handleAccept">接受任务</view>
      </template>
      <template v-else-if="canAudit">
        <view class="ui-btn ui-btn--danger" @click="handleAudit(false)">驳回</view>
        <view class="ui-btn ui-btn--primary bar-main" @click="handleAudit(true)">审核通过</view>
      </template>
      <view v-else-if="canComplete" class="ui-btn ui-btn--primary" @click="goComplete">去完成</view>
      <view v-else-if="canRepublish" class="ui-btn ui-btn--primary" @click="goEdit">重新发布</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { getTaskDetail, acceptTask, rejectTask, auditTask, urgeTask, cancelTask, stopCycleTask, deleteTask } from '@/api/task'
import { TaskStatusMap, ExecutorStatusMap } from '@/types/task'
import { PRIORITY_OPTIONS } from '@/constants/task'
import { resolveImageUrl } from '@/api/request'
import { formatDate } from '@/utils/date'
import type { Task } from '@/types/task'

const authStore = useAuthStore()
const roomStore = useRoomStore()
const task = ref<Task | null>(null)
let taskId = 0

const statusInfo = computed(() => TaskStatusMap[task.value?.status || 0] || { text: '未知', color: '#9AA8BC' })
const cycleText = computed(() => {
  const rule = task.value?.cycle_rule
  if (!rule) return '周期任务'
  const typeMap: Record<string, string> = { daily: '每天', weekly: '每周', monthly: '每月' }
  let text = typeMap[rule.type] || rule.type
  if (rule.type === 'monthly' && rule.day_of_month) text += ` ${rule.day_of_month}号`
  if (rule.time) text += ` ${rule.time}`
  return text
})
const priorityText = computed(() => PRIORITY_OPTIONS.find(p => p.value === task.value?.priority)?.label || '普通')
const priorityColor = computed(() => PRIORITY_OPTIONS.find(p => p.value === task.value?.priority)?.color || '#9AA8BC')
const finishRemark = computed(() => task.value?.finish_remark?.trim() || '')
const finishImageUrls = computed(() =>
  (task.value?.finish_images || [])
    .map(path => resolveImageUrl(path))
    .filter(Boolean),
)

function previewFinishImages(index: number) {
  const urls = finishImageUrls.value
  if (!urls.length) return
  uni.previewImage({ urls, current: urls[index] })
}
const currentExecutor = computed(() => task.value?.executors?.find(e => e.user_id === authStore.userInfo?.id))
const isExecutor = computed(() => !!currentExecutor.value)
const isPendingExecutor = computed(() => currentExecutor.value?.status === 0)
const isLeader = computed(() => roomStore.currentRoom?.owner_id === authStore.userInfo?.id)

const s = computed(() => task.value?.status)

/** 宿舍长审核：待审核状态 */
const canAudit = computed(() => isLeader.value && s.value === 4)

/** 去完成：进行中/已驳回/已超时，仅执行人可操作 */
const canComplete = computed(() => {
  if (s.value !== 1 && s.value !== 7 && s.value !== 6) return false
  return isExecutor.value
})

/** 重新发布：已拒绝/已取消，仅宿舍长 */
const canRepublish = computed(() => isLeader.value && (s.value === 2 || s.value === 8))

/** 催办：进行中/已超时，仅宿舍长可操作 */
const canUrge = computed(() => {
  if (!isLeader.value) return false
  return s.value === 1 || s.value === 6
})

/** 取消：非已完成/已取消，仅宿舍长 */
const canCancel = computed(() => isLeader.value && s.value !== 5 && s.value !== 8)

/** 结束周期：周期任务且非子任务，仅宿舍长 */
const canStopCycle = computed(() => isLeader.value && task.value?.is_cycle && !task.value?.parent_cycle_id)

/** 删除：仅宿舍长可操作 */
const canDelete = computed(() => isLeader.value)

/** 状态提示：当前无操作按钮时，提示等待方 */
const statusHint = computed(() => {
  if (!task.value) return ''
  // 执行人已提交待审核
  if (s.value === 4 && isExecutor.value) return '已提交完成，等待宿舍长审核'
  // 非执行人的宿舍长看待审核
  if (s.value === 4 && isLeader.value && !isExecutor.value) return '执行人已提交，请审核'
  // 宿舍长待接受状态
  if (s.value === 0 && isLeader.value) return '等待执行人接受任务'
  // 宿舍长看进行中
  if (s.value === 1 && isLeader.value) return '执行人正在处理中'
  // 宿舍长看已超时
  if (s.value === 6 && isLeader.value) return '任务已超时，可催办执行人'
  // 宿舍长看已驳回
  if (s.value === 7 && isLeader.value) return '等待执行人重新提交'
  return ''
})

onLoad((options) => { taskId = Number(options?.id) })

onShow(async () => {
  if (taskId) {
    const res = await getTaskDetail(taskId)
    task.value = res.data
  }
})

async function handleAccept() {
  await acceptTask(taskId)
  uni.showToast({ title: '已接受', icon: 'success' })
  const res = await getTaskDetail(taskId)
  task.value = res.data
}

async function handleReject() {
  uni.showModal({
    title: '拒绝任务',
    editable: true,
    placeholderText: '请输入拒绝原因',
    success: async (res) => {
      if (res.confirm) {
        await rejectTask(taskId, res.content || '')
        uni.showToast({ title: '已拒绝', icon: 'success' })
        const detail = await getTaskDetail(taskId)
        task.value = detail.data
      }
    },
  })
}

async function handleAudit(approved: boolean) {
  if (approved) {
    await auditTask(taskId, true)
    uni.showToast({ title: '已通过', icon: 'success' })
    const detail = await getTaskDetail(taskId)
    task.value = detail.data
  } else {
    uni.showModal({
      title: '驳回任务',
      editable: true,
      placeholderText: '请输入驳回原因',
      success: async (res) => {
        if (res.confirm) {
          await auditTask(taskId, false, res.content || '')
          uni.showToast({ title: '已驳回', icon: 'success' })
          const detail = await getTaskDetail(taskId)
          task.value = detail.data
        }
      },
    })
  }
}

async function handleCancel() {
  uni.showModal({
    title: '取消任务',
    content: '确定取消该任务吗？取消后可重新发布。',
    success: async (res) => {
      if (res.confirm) {
        await cancelTask(taskId)
        uni.showToast({ title: '已取消', icon: 'success' })
        const detail = await getTaskDetail(taskId)
        task.value = detail.data
      }
    },
  })
}

async function handleStopCycle() {
  uni.showModal({
    title: '结束周期',
    content: '确定结束该任务的周期吗？结束后将不再自动生成新任务。',
    success: async (res) => {
      if (res.confirm) {
        await stopCycleTask(taskId)
        uni.showToast({ title: '已结束周期', icon: 'success' })
        const detail = await getTaskDetail(taskId)
        task.value = detail.data
      }
    },
  })
}

async function handleUrge() {
  // Optimistic update: immediately show urged state
  if (task.value) {
    task.value = { ...task.value, is_urged: true }
  }
  try {
    await urgeTask(taskId)
    uni.showToast({ title: '已催办', icon: 'success' })
  } catch {
    // Revert on failure
    if (task.value) {
      task.value = { ...task.value, is_urged: false }
    }
  }
}

async function handleDelete() {
  uni.showModal({
    title: '删除任务',
    content: '确定删除该任务吗？删除后可在"最近删除"中恢复，7天后将自动清除。',
    success: async (res) => {
      if (res.confirm) {
        await deleteTask(taskId)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    },
  })
}

function goEdit() { uni.navigateTo({ url: `/pages/task/create?id=${taskId}` }) }

function goComplete() { uni.navigateTo({ url: `/pages/task/complete?id=${taskId}` }) }
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.detail-page {
  min-height: 100vh;
  background: $bg-page;
  padding: $space-3 $page-gutter 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

/* 头部信息 */
.head {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.head-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-1;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: $radius-xs;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
  box-sizing: border-box;

  &__dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
  }
}

.head-title {
  margin-top: $space-1;
  font-size: $font-lg;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.3;
  word-break: break-all;
}

.head-desc {
  font-size: $font-sm;
  color: $text-secondary;
  line-height: 1.6;
  word-break: break-all;
}

.head-meta {
  margin-top: $space-2;
  padding-top: $space-3;
  border-top: 1rpx solid $border-light;
  display: flex;
  align-items: center;

  &__item {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__divider {
    width: 1rpx;
    height: 56rpx;
    background: $border-light;
    margin: 0 $space-3;
  }

  &__lbl {
    font-size: 22rpx;
    color: $text-hint;
    line-height: 1.4;
  }

  &__val {
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
    line-height: 1.4;
  }
}

/* 提示条 */
.notice {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3;
  background: $primary-bg;
  border-radius: $radius-md;

  &--warn {
    align-items: center;
    background: $warning-bg;
  }

  &__icon {
    flex-shrink: 0;
    width: 36rpx;
    height: 36rpx;
  }

  &__dot {
    flex-shrink: 0;
    width: 10rpx;
    height: 10rpx;
    margin-top: 14rpx;
    border-radius: 50%;
    background: $primary;
  }

  &__text {
    flex: 1;
    font-size: $font-sm;
    font-weight: 500;
    color: $text-primary;
    line-height: 1.5;

    &--sub {
      font-size: $font-xs;
      font-weight: 400;
      color: $text-secondary;
      line-height: 1.6;
    }
  }
}

/* 周期 */
.cycle {
  display: flex;
  align-items: center;
  gap: $space-3;

  &-icon {
    flex-shrink: 0;
    width: 72rpx;
    height: 72rpx;
    border-radius: $radius-md;
    background: $success-bg;
    display: flex;
    align-items: center;
    justify-content: center;

    &-img {
      width: 36rpx;
      height: 36rpx;
    }
  }

  &-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &-title {
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
  }

  &-hint {
    font-size: $font-xs;
    color: $text-hint;
  }
}

/* 执行人 */
.panel-count {
  font-size: $font-xs;
  color: $text-hint;
}

.panel-empty {
  display: block;
  padding: $space-2 0;
  font-size: $font-sm;
  color: $text-hint;
}

.people {
  display: flex;
  flex-direction: column;
}

.person {
  display: flex;
  align-items: center;
  gap: $space-3;
  min-height: 96rpx;
  border-bottom: 1rpx solid $border-light;

  &:last-child {
    border-bottom: none;
  }

  &-avatar {
    flex-shrink: 0;
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: $primary-bg;
    display: flex;
    align-items: center;
    justify-content: center;

    &-text {
      font-size: $font-sm;
      font-weight: 600;
      line-height: 1;
      color: $primary;
    }
  }

  &-name {
    flex: 1;
    min-width: 0;
    font-size: $font-sm;
    font-weight: 500;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-status {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    height: 44rpx;
    padding: 0 16rpx;
    border-radius: $radius-xs;
    font-size: 22rpx;
    font-weight: 600;
    line-height: 1;
  }
}

/* 完成记录 */
.finish-remark {
  display: block;
  font-size: $font-sm;
  color: $text-primary;
  line-height: 1.7;
  margin-bottom: $space-3;
  word-break: break-all;
}

.finish-images {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-2;
}

.finish-cell {
  position: relative;
  padding-top: 100%;
  border-radius: $radius-sm;
  overflow: hidden;
  background: $bg-subtle;
}

.finish-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 管理工具 */
.tools {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-2;
}

.tool {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $bg-card;
  border: 1rpx solid $border-color;
  font-size: $font-sm;
  font-weight: 500;
  color: $text-primary;
  line-height: 1;
  box-sizing: border-box;

  &:active {
    background: $bg-hover;
  }

  &--danger {
    color: $danger;

    &:active {
      background: $danger-bg;
    }
  }
}

.bar-main {
  flex: 2;
}
</style>

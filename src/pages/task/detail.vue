<template>
  <view class="task-detail-page" v-if="task">
    <!-- 头部卡片 -->
    <view class="hero-card section-card section-card-task">
      <view class="hero-header">
        <text class="title">{{ task.title }}</text>
        <view class="status-tag" :style="{ backgroundColor: statusInfo.color + '14', color: statusInfo.color }">
          {{ statusInfo.text }}
        </view>
      </view>
      <text class="description" v-if="task.description">{{ task.description }}</text>
    </view>

    <!-- 催办提示 -->
    <view v-if="task.is_urged && isExecutor" class="urge-banner">
      <image class="urge-icon" src="/static/icons/bell.png" mode="aspectFit" />
      <text class="urge-text">宿舍长已催办，请尽快处理</text>
    </view>

    <!-- 信息网格 -->
    <view class="info-card card">
      <view class="info-row">
        <view class="info-icon-wrap">
          <image class="info-icon-img" src="/static/icons/clock.png" mode="aspectFit" />
        </view>
        <view class="info-content">
          <text class="info-label">截止时间</text>
          <text class="info-value">{{ formatDate(task.deadline) }}</text>
        </view>
      </view>
      <view class="info-row">
        <view class="info-icon-wrap">
          <view class="priority-dot" :style="{ backgroundColor: priorityColor }"></view>
        </view>
        <view class="info-content">
          <text class="info-label">优先级</text>
          <text class="info-value" :style="{ color: priorityColor }">{{ priorityText }}</text>
        </view>
      </view>
      <view class="info-row">
        <view class="info-icon-wrap">
          <image class="info-icon-img" src="/static/icons/calendar.png" mode="aspectFit" />
        </view>
        <view class="info-content">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatDate(task.create_time) }}</text>
        </view>
      </view>
      <view v-if="task.is_cycle && !task.parent_cycle_id" class="info-row">
        <view class="info-icon-wrap">
          <image class="info-icon-img" src="/static/icons/refresh.png" mode="aspectFit" />
        </view>
        <view class="info-content">
          <text class="info-label">周期任务</text>
          <text class="info-value">{{ cycleText }}</text>
          <text v-if="task.cycle_end_date" class="info-hint">结束时间：{{ formatDate(task.cycle_end_date) }}</text>
        </view>
      </view>
      <view class="info-row">
        <view class="info-icon-wrap">
          <image class="info-icon-img" src="/static/icons/users-sm.png" mode="aspectFit" />
        </view>
        <view class="info-content">
          <text class="info-label">执行人</text>
          <view class="executor-list">
            <view v-for="ex in task.executors" :key="ex.user_id" class="executor-tag">
              <text class="executor-name">{{ ex.nickname }}</text>
              <text class="executor-status" :style="{ color: ExecutorStatusMap[ex.status]?.color || '#94A3B8' }">
                {{ ExecutorStatusMap[ex.status]?.text || '未知' }}
              </text>
            </view>
            <text v-if="!task.executors?.length" class="info-value">-</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="finishRemark || finishImageUrls.length" class="finish-card card">
      <text class="finish-title">完成记录</text>
      <text v-if="finishRemark" class="finish-remark">{{ finishRemark }}</text>
      <view v-if="finishImageUrls.length" class="finish-images">
        <image
          v-for="(url, idx) in finishImageUrls"
          :key="idx"
          :src="url"
          class="finish-img"
          mode="aspectFill"
          @click="previewFinishImages(idx)"
        />
      </view>
    </view>

    <!-- 状态提示 -->
      <view v-if="statusHint" class="status-hint">
        <text class="hint-icon">💡</text>
        <text class="hint-text">{{ statusHint }}</text>
      </view>

      <!-- 操作按钮 -->
    <view class="action-section">
      <!-- 执行人：待接受 -->
      <view class="action-pair" v-if="isPendingExecutor">
        <button class="btn btn-primary" @click="handleAccept">接受任务</button>
        <button class="btn btn-outline" @click="handleReject">拒绝</button>
      </view>

      <!-- 宿舍长：待审核 -->
      <view class="action-pair" v-else-if="canAudit">
        <button class="btn btn-primary" @click="handleAudit(true)">通过</button>
        <button class="btn btn-danger" @click="handleAudit(false)">驳回</button>
      </view>

      <!-- 执行人/宿舍长：去完成 -->
      <view class="action-single" v-else-if="canComplete">
        <button class="btn btn-primary btn-block" @click="goComplete">去完成</button>
      </view>

      <!-- 宿舍长：重新发布 -->
      <view class="action-single" v-else-if="canRepublish">
        <button class="btn btn-primary btn-block" @click="goEdit">重新发布</button>
      </view>

      <!-- 操作工具（按钮形式，无图标） -->
      <view class="tools-section" v-if="isLeader && !canAudit">
        <view class="tools-divider"></view>
        <view class="tools-row" v-if="canUrge || canStopCycle">
          <button v-if="canUrge" class="tools-btn" @click="handleUrge">催办</button>
          <button v-if="canStopCycle" class="tools-btn" @click="handleStopCycle">结束周期</button>
        </view>
        <view class="tools-row">
          <button v-if="canCancel" class="tools-btn" @click="handleCancel">取消任务</button>
          <button v-if="canDelete" class="tools-btn tools-btn-danger" @click="handleDelete">删除任务</button>
        </view>
      </view>
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

const statusInfo = computed(() => TaskStatusMap[task.value?.status || 0] || { text: '未知', color: '#94A3B8' })
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
const priorityColor = computed(() => PRIORITY_OPTIONS.find(p => p.value === task.value?.priority)?.color || '#94A3B8')
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

.task-detail-page {
  padding: $space-3;
  min-height: 100vh;
  background: $bg-page;
}

.urge-banner {
  display: flex;
  align-items: center;
  gap: $space-2;
  background-color: rgba($warning, 0.1);
  border: 1rpx solid rgba($warning, 0.3);
  border-radius: $radius-lg;
  padding: $space-2 $space-3;
  margin-bottom: $space-3;

  .urge-icon {
    width: 28rpx;
    height: 28rpx;
    flex-shrink: 0;
  }

  .urge-text {
    font-size: $font-xs;
    color: $warning;
    font-weight: 600;
  }
}

.hero-card {
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-xl;
  padding: $space-4;
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
    background: $primary;
    opacity: 0.4;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  .hero-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $space-2;

    .title {
      font-size: $font-md;
      font-weight: 700;
      color: $text-primary;
      flex: 1;
      margin-right: $space-3;
      line-height: 1.3;
    }

    .status-tag {
      font-size: $font-xs;
      padding: $space-1 $space-3;
      border-radius: $radius-full;
      white-space: nowrap;
      font-weight: 500;
    }
  }

  .description {
    font-size: $font-sm;
    color: $text-secondary;
    line-height: 1.5;
    display: block;
  }
}

.info-card {
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-xl;
  padding: $space-4;
  box-shadow: $shadow-sm;

  .info-row {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-3 0;

    &:not(:last-child) {
      border-bottom: 1rpx solid $border-light;
    }

    .info-icon-wrap {
      width: 40rpx;
      height: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .info-icon-img {
        width: 28rpx;
        height: 28rpx;
      }

      .priority-dot {
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
      }
    }

    .info-content {
      flex: 1;

      .info-label {
        font-size: $font-xs;
        color: $text-hint;
        display: block;
        margin-bottom: 2rpx;
      }

      .info-value {
        font-size: $font-sm;
        color: $text-primary;
        font-weight: 500;
        display: block;
      }

      .info-hint {
        font-size: $font-xs;
        color: $text-hint;
        display: block;
        margin-top: 2rpx;
      }

      .executor-list {
        display: flex;
        flex-wrap: wrap;
        gap: $space-2;

        .executor-tag {
          display: inline-flex;
          align-items: center;
          gap: $space-2;
          background-color: $bg-hover;
          padding: $space-1 $space-3;
          border-radius: $radius-full;

          .executor-name {
            font-size: $font-xs;
            color: $text-primary;
            font-weight: 500;
          }

          .executor-status {
            font-size: 20rpx;
          }
        }
      }
    }
  }
}

.finish-card {
  margin-top: $space-3;
  padding: $space-4;

  .finish-title {
    display: block;
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $space-3;
  }

  .finish-remark {
    display: block;
    font-size: $font-sm;
    color: $text-secondary;
    line-height: 1.6;
    margin-bottom: $space-3;
  }

  .finish-images {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
  }

  .finish-img {
    width: 180rpx;
    height: 180rpx;
    border-radius: $radius-lg;
  }
}

.action-section {
  margin-top: $space-4;
}

.status-hint {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  background-color: rgba($primary, 0.06);
  border: 1rpx solid rgba($primary, 0.12);
  border-radius: $radius-lg;
  margin-bottom: $space-3;

  .hint-icon {
    font-size: $font-xs;
  }

  .hint-text {
    font-size: $font-xs;
    color: $primary;
    font-weight: 500;
  }
}

.action-pair {
  display: flex;
  gap: $space-3;

  .btn {
    flex: 1;
    height: 88rpx;
    border-radius: $radius-lg;
    font-size: $font-sm;
    font-weight: 600;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: $transition-fast;

    &::after { display: none; }

    &:active { opacity: 0.85; }
  }
}

.action-single {
  .btn {
    width: 100%;
    height: 88rpx;
    border-radius: $radius-lg;
    font-size: $font-sm;
    font-weight: 600;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: $transition-fast;

    &::after { display: none; }

    &:active { opacity: 0.85; }
  }
}

.btn-primary {
  background: $primary-gradient;
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba($primary, 0.25);
}

.btn-outline {
  background: $bg-card;
  color: $text-primary;
  border: 2rpx solid $border-color !important;
  box-shadow: $shadow-sm;
}

.btn-danger {
  background: $bg-card;
  color: $danger;
  border: 2rpx solid rgba($danger, 0.3) !important;
  box-shadow: $shadow-sm;
}

.tools-section {
  margin-top: $space-3;

  .tools-divider {
    height: 1rpx;
    background: $border-light;
    margin-bottom: $space-3;
  }

  .tools-row {
    display: flex;
    gap: $space-3;
    margin-bottom: $space-3;

    &:last-child {
      margin-bottom: 0;
    }

    .tools-btn {
      flex: 1;
      height: 88rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      font-size: $font-sm;
      font-weight: 600;
      color: $text-primary;
      background-color: $bg-card;
      border: 1rpx solid $border-color;
      border-radius: $radius-lg;
      transition: $transition-fast;
      box-shadow: $shadow-sm;

      &:active {
        background-color: $bg-hover;
      }

      &.tools-btn-danger {
        color: $danger;
        border-color: rgba($danger, 0.2);

        &:active {
          background-color: rgba($danger, 0.04);
        }
      }
    }
  }
}
</style>

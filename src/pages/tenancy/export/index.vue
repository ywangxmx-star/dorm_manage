<template>
  <view class="export-page">
    <view class="ui-header">
      <text class="ui-header__eyebrow">EXPORT · 数据导出</text>
      <view class="ui-header__row">
        <text class="ui-header__title">数据导出</text>
      </view>
      <text class="ui-header__sub">打包租房数据，生成 24 小时有效下载链接</text>
    </view>

    <text class="ui-form-label">导出内容</text>
    <view class="ui-form-group">
      <view
        v-for="m in moduleOptions" :key="m.key"
        class="module-row" @click="toggle(m.key)"
      >
        <text class="module-row__label">{{ m.label }}</text>
        <view class="module-row__check" :class="{ 'is-on': selected.includes(m.key) }">
          <text v-if="selected.includes(m.key)">✓</text>
        </view>
      </view>
      <view class="module-row" @click="relatedToMe = !relatedToMe">
        <text class="module-row__label">仅导出与我相关</text>
        <view class="module-row__check" :class="{ 'is-on': relatedToMe }">
          <text v-if="relatedToMe">✓</text>
        </view>
      </view>
    </view>

    <view class="submit-wrap">
      <view class="ui-btn ui-btn--primary" :class="{ 'is-disabled': creating || selected.length === 0 }" @click="create">提交导出</view>
    </view>

    <text class="ui-form-label">导出历史</text>
    <view class="ui-form-group">
      <view v-if="jobs.length === 0" class="history-empty">暂无记录</view>
      <view v-for="j in jobs" :key="j.id" class="ui-cell">
        <view class="job-info">
          <text class="job-info__title">#{{ j.id }} · {{ moduleText(j.modules) }}</text>
          <text class="job-info__sub">{{ formatTime(j.create_time) }} · {{ statusText(j.status) }}</text>
          <text v-if="j.status === 2 && j.fail_reason" class="job-info__fail">{{ j.fail_reason }}</text>
        </view>
        <view class="job-ops">
          <text v-if="j.status === 1" class="job-op job-op--primary" @click="download(j.id)">复制链接</text>
          <text v-if="j.status === 2" class="job-op" @click="retry(j.id)">重试</text>
        </view>
      </view>
    </view>

    <view class="ui-bottom-spacer" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { createExport, getExportList, getExportDetail, retryExport } from '@/api/tenancy'
import type { ExportJob } from '@/types/tenancy'

const roomId = ref(0)
const selected = ref<string[]>(['lease', 'inspect', 'checkout', 'rent_bill'])
const relatedToMe = ref(false)
const jobs = ref<ExportJob[]>([])
const creating = ref(false)

const moduleOptions = [
  { key: 'lease', label: '租约摘要' },
  { key: 'inspect', label: '入住验房' },
  { key: 'checkout', label: '退租验收' },
  { key: 'rent_bill', label: '租房账单' },
  { key: 'bill', label: '生活账单' },
  { key: 'member', label: '成员清单' },
]

onLoad((query) => {
  roomId.value = Number(query?.room_id || 0)
})

onShow(() => load())

async function load() {
  if (!roomId.value) return
  const res = await getExportList({ room_id: roomId.value, page_size: 20 })
  jobs.value = res.data.items
}

function toggle(key: string) {
  const idx = selected.value.indexOf(key)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(key)
}

function moduleText(modules: string[]) {
  return modules.map(k => moduleOptions.find(o => o.key === k)?.label || k).join('/')
}

function statusText(s: number) {
  return ({ 0: '排队中', 1: '成功', 2: '失败' } as Record<number, string>)[s] || ''
}

function formatTime(t: string) {
  return t ? t.slice(0, 16).replace('T', ' ') : ''
}

async function create() {
  creating.value = true
  try {
    await createExport({
      room_id: roomId.value,
      modules: selected.value,
      related_to_me: relatedToMe.value,
    })
    uni.showToast({ title: '已提交，稍后可在历史查看', icon: 'none' })
    setTimeout(load, 1500)
  } finally {
    creating.value = false
  }
}

async function download(jobId: number) {
  const res = await getExportDetail(jobId)
  if (!res.data.download_url) {
    uni.showToast({ title: '链接不可用', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: res.data.download_url,
    success: () => uni.showToast({ title: '链接已复制，24小时内有效', icon: 'none' }),
  })
}

async function retry(jobId: number) {
  await retryExport(jobId)
  uni.showToast({ title: '已重新排队', icon: 'none' })
  setTimeout(load, 1500)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.export-page {
  min-height: 100vh;
  padding-bottom: $space-16;
}

.module-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;
  padding: 24rpx 0;
  border-bottom: 2rpx dashed $border-color;

  &:last-child {
    border-bottom: none;
  }

  &__label {
    font-size: $font-sm;
    color: $text-primary;
    font-weight: 600;
  }

  &__check {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    border: 2rpx solid $border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    color: $text-white;
    flex-shrink: 0;
    transition: $transition-fast;

    &.is-on {
      background: $primary;
      border-color: $primary;
    }
  }
}

.submit-wrap {
  margin: $space-4 $space-5;
  display: flex;

  .ui-btn {
    flex: 1;
  }
}

.history-empty {
  padding: $space-6 0;
  text-align: center;
  font-size: $font-xs;
  color: $text-hint;
}

.job-info {
  display: flex;
  flex-direction: column;
  flex: 1;

  &__title {
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
  }

  &__sub {
    font-size: $font-xs;
    color: $text-hint;
    margin-top: 4rpx;
  }

  &__fail {
    font-size: $font-xs;
    color: $danger;
    margin-top: 4rpx;
  }
}

.job-op {
  font-size: $font-xs;
  color: $primary;
  font-weight: 600;
  padding: $space-2 $space-3;

  &:active {
    opacity: 0.6;
  }
}
</style>

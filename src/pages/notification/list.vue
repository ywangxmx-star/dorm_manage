<template>
  <view class="notify-page">
    <view class="ui-header">
      <text class="ui-header__eyebrow">NOTICE · 消息通知</text>
      <view class="ui-header__row">
        <text class="ui-header__title">通知</text>
        <text class="read-all" @click="readAll">全部已读</text>
      </view>
    </view>

    <view class="ui-seg">
      <view class="ui-seg__item" :class="{ 'is-active': filter === undefined }" @click="switchTab(undefined)">
        <text>全部</text>
      </view>
      <view class="ui-seg__item" :class="{ 'is-active': filter === false }" @click="switchTab(false)">
        <text>未读</text>
      </view>
    </view>

    <view class="list-wrap">
      <view v-if="list.length === 0" class="empty-box">
        <EmptyState title="暂无通知" text="验房、账单、导出的消息会出现在这里" />
      </view>
      <view
        v-for="n in list" :key="n.id"
        class="notify-card" :class="{ 'is-unread': !n.is_read }"
        @click="open(n)"
      >
        <view class="notify-card__row">
          <text class="notify-card__title">{{ n.title }}</text>
          <text class="notify-card__time">{{ formatTime(n.create_time) }}</text>
        </view>
        <view class="notify-card__content">{{ n.content }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getNotificationList, markNotificationsRead } from '@/api/tenancy'
import EmptyState from '@/components/EmptyState.vue'
import type { AppNotification } from '@/types/tenancy'

const list = ref<AppNotification[]>([])
const filter = ref<boolean | undefined>(undefined)

onShow(() => load())

async function load() {
  const res = await getNotificationList({ is_read: filter.value, page_size: 50 })
  list.value = res.data.items
}

function switchTab(v: boolean | undefined) {
  filter.value = v
  load()
}

function formatTime(t: string) {
  return t ? t.slice(5, 16).replace('T', ' ') : ''
}

async function open(n: AppNotification) {
  if (!n.is_read) {
    await markNotificationsRead([n.id])
    n.is_read = true
  }
  if (!n.biz_id || !n.room_id) return
  const routes: Record<string, string> = {
    inspect: `/pages/tenancy/inspect/detail?room_id=${n.room_id}&id=${n.biz_id}`,
    checkout: `/pages/tenancy/checkout/detail?room_id=${n.room_id}&id=${n.biz_id}`,
    rent_bill: `/pages/tenancy/rent-bill/detail?room_id=${n.room_id}&id=${n.biz_id}`,
    export: `/pages/tenancy/export/index?room_id=${n.room_id}`,
  }
  const url = routes[n.biz_type]
  if (url) uni.navigateTo({ url })
}

async function readAll() {
  await markNotificationsRead([], true)
  load()
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.notify-page {
  min-height: 100vh;
  padding-bottom: $space-16;
}

.read-all {
  font-size: $font-xs;
  font-weight: 600;
  color: $primary;
  padding: $space-2 0;

  &:active {
    opacity: 0.6;
  }
}

.ui-seg {
  margin-bottom: $space-4;
}

.list-wrap {
  padding: 0 $space-5;
}

.empty-box {
  padding-top: $space-8;
}

.notify-card {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 2rpx solid $border-light;
  box-shadow: $shadow-sm;
  padding: $space-4;
  margin-bottom: $space-3;
  transition: $transition-base;

  &:active {
    transform: scale(0.99);
    box-shadow: $shadow-card;
  }

  &.is-unread {
    border-left: 8rpx solid $primary;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-3;
  }

  &__title {
    font-size: $font-base;
    font-weight: 700;
    color: $text-primary;
  }

  &__time {
    font-size: $font-xs;
    color: $text-hint;
    flex-shrink: 0;
  }

  &__content {
    margin-top: $space-2;
    font-size: $font-sm;
    color: $text-secondary;
    line-height: 1.6;
  }
}
</style>

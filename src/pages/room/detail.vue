<template>
  <view class="room-detail-page">
    <!-- 无宿舍空状态 -->
    <view class="empty-room card" v-if="!room && !loading">
      <view class="empty-icon">
        <image class="empty-img" src="/static/icons/home.png" mode="aspectFit" />
      </view>
      <text class="empty-title">您还没有加入或创建任何宿舍</text>
      <text class="empty-desc">创建一个新宿舍或通过邀请码加入已有宿舍</text>
      <view class="empty-actions">
        <button class="btn-primary" @click="goCreateRoom">创建宿舍</button>
        <button class="btn-outline" @click="goJoinRoom">加入宿舍</button>
      </view>
    </view>

    <!-- 宿舍详情 -->
    <template v-if="room">
      <!-- 宿舍头部 -->
      <view class="room-hero card">
        <view class="room-hero-bg">
          <image class="room-hero-icon" src="/static/icons/home.png" mode="aspectFit" />
        </view>
        <view class="room-hero-content">
          <text class="room-name">{{ room.room_name }}</text>
          <view class="room-type-tag tag tag-primary">{{ roomTypeText }}</view>
          <view class="notice-row" v-if="!editingNotice && (room.notice || isOwner)" @click="isOwner ? startEditNotice() : undefined">
            <text class="room-notice">{{ room.notice || (isOwner ? '点击编辑公告' : '') }}</text>
            <text v-if="isOwner" class="edit-hint">编辑</text>
          </view>
          <view class="notice-edit" v-if="editingNotice">
            <textarea
              v-model="noticeDraft"
              class="notice-textarea"
              placeholder="请输入公告"
              maxlength="100"
              @input="onNoticeInput"
            />
            <view class="notice-edit-actions">
              <text class="notice-count">{{ noticeDraft.length }}/100</text>
              <view class="action-btns">
                <button class="btn-outline btn-sm" @click="cancelEditNotice">取消</button>
                <button class="btn-primary btn-sm" :disabled="savingNotice" @click="saveNotice">
                  <text v-if="!savingNotice">保存</text>
                  <view v-else class="loading-spinner spinner-sm"></view>
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 邀请码 -->
      <view class="invite-card card" @click="copyCode">
        <view class="invite-header">
          <text class="invite-label">邀请码</text>
          <text class="invite-hint">点击复制</text>
        </view>
        <text class="invite-code">{{ room.invite_code }}</text>
      </view>

      <!-- 信息卡片 -->
      <view class="info-card card">
        <view class="info-row">
          <text class="info-label">成员数</text>
          <text class="info-value">{{ room.member_count }} / {{ room.max_member }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatDate(room.create_time) }}</text>
        </view>
      </view>

      <!-- 租务入口 -->
      <view class="info-card card tenancy-entry" @click="goTenancy">
        <view class="info-row">
          <text class="info-label">租务管理</text>
          <text class="info-value tenancy-arrow">验房 · 租金 · 退租 ›</text>
        </view>
      </view>

      <!-- 操作 -->
      <view class="actions">
        <button class="btn-primary" @click="goMembers">成员管理</button>
        <button v-if="isOwner" class="btn-outline action-btn" @click="handleTransfer">转让宿舍长</button>
        <button v-if="isOwner" class="btn-danger action-btn" @click="handleDissolve">解散宿舍</button>
        <button v-else class="btn-outline action-btn" @click="handleLeave">退出宿舍</button>
      </view>
    </template>

    <!-- 转让宿舍长弹窗 -->
    <view class="picker-mask" v-if="showTransferPicker" @click="showTransferPicker = false">
      <view class="picker" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择新宿舍长</text>
          <image class="picker-close" src="/static/icons/x.png" mode="aspectFit" @click="showTransferPicker = false" />
        </view>
        <scroll-view scroll-y class="picker-list">
          <view
            v-for="member in transferableMembers"
            :key="member.user_id"
            class="picker-item"
            @click="confirmTransfer(member)"
          >
            <view class="picker-item-info">
              <text class="picker-item-name">{{ member.nickname || `用户 #${member.user_id}` }}</text>
            </view>
            <view v-if="transferring" class="picker-item-loading">
              <view class="loading-spinner spinner-sm"></view>
            </view>
          </view>
          <view v-if="transferableMembers.length === 0" class="picker-empty">
            <text class="empty-text">没有可转让的成员</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRoomStore } from '@/stores/room'
import { useAuthStore } from '@/stores/auth'
import { useRequireLogin } from '@/composables/useRequireLogin'
import { useShare, DEFAULT_SHARE } from '@/composables/useShare'
import { getRoomDetail, updateRoom, deleteRoom, leaveRoom, transferOwnership, getMembers } from '@/api/room'
import { formatDate } from '@/utils/date'
import type { Room, Member } from '@/types/room'

const roomStore = useRoomStore()
const authStore = useAuthStore()
const { requireLogin } = useRequireLogin()
const room = ref<Room | null>(null)
const loading = ref(true)
let targetRoomId = 0

const showTransferPicker = ref(false)
const members = ref<Member[]>([])
const transferring = ref(false)
const editingNotice = ref(false)
const noticeDraft = ref('')
const savingNotice = ref(false)

const isOwner = computed(() => room.value?.owner_id === authStore.userInfo?.id)

const transferableMembers = computed(() => {
  return members.value.filter(m => m.user_id !== authStore.userInfo?.id && m.status === 1)
})

const roomTypeText = computed(() => {
  const map: Record<number, string> = { 0: '学生宿舍', 1: '合租', 2: '员工宿舍' }
  return map[room.value?.room_type || 0] || ''
})

useShare(() => {
  if (room.value?.invite_code) {
    return {
      title: `邀请你加入「${room.value.room_name}」`,
      path: `/pages/room/join?code=${room.value.invite_code}`,
      imageUrl: DEFAULT_SHARE.imageUrl,
    }
  }
  return DEFAULT_SHARE
})

onLoad((options) => {
  if (options?.id) {
    targetRoomId = Number(options.id)
  }
})

onShow(async () => {
  const roomId = targetRoomId || roomStore.currentRoom?.id
  if (roomId) {
    try {
      const res = await getRoomDetail(roomId)
      room.value = res.data
    } catch {
      // ignore
    }
  }
  loading.value = false
})

async function loadMembers() {
  if (!room.value) return
  try {
    const res = await getMembers(room.value.id)
    members.value = res.data
  } catch {
    // ignore
  }
}

function goTenancy() {
  if (!room.value) return
  uni.navigateTo({ url: `/pages/tenancy/hub?room_id=${room.value.id}` })
}

function handleTransfer() {
  loadMembers()
  showTransferPicker.value = true
}

async function confirmTransfer(member: Member) {
  if (!room.value || transferring.value) return

  uni.showModal({
    title: '转让宿舍长',
    content: `确定将宿舍长转让给「${member.nickname || '该用户'}」吗？转让后您将成为普通成员。`,
    success: async (res) => {
      if (!res.confirm || !room.value) return
      transferring.value = true
      try {
        await transferOwnership(room.value.id, member.user_id)
        uni.showToast({ title: '转让成功', icon: 'success' })
        showTransferPicker.value = false
        // 刷新宿舍详情
        const detailRes = await getRoomDetail(room.value.id)
        room.value = detailRes.data
      } catch {
        // handled by request interceptor
      } finally {
        transferring.value = false
      }
    },
  })
}

function startEditNotice() {
  if (!room.value) return
  noticeDraft.value = room.value.notice || ''
  editingNotice.value = true
}

function onNoticeInput(e: any) {
  const value = e.detail.value || ''
  if (value.length > 100) {
    noticeDraft.value = value.slice(0, 100)
  } else {
    noticeDraft.value = value
  }
}

function cancelEditNotice() {
  editingNotice.value = false
  noticeDraft.value = ''
}

async function saveNotice() {
  if (!room.value || savingNotice.value) return
  const notice = noticeDraft.value.trim()
  if (notice === room.value.notice) {
    editingNotice.value = false
    return
  }
  savingNotice.value = true
  try {
    const detailRes = await updateRoom(room.value.id, { notice })
    room.value = detailRes.data
    editingNotice.value = false
    uni.showToast({ title: '已更新', icon: 'success' })
  } catch {
    // handled by request interceptor
  } finally {
    savingNotice.value = false
  }
}

function copyCode() {
  if (room.value?.invite_code) {
    uni.setClipboardData({ data: room.value.invite_code, success: () => {
      uni.showToast({ title: '已复制', icon: 'success' })
    }})
  }
}

function handleLeave() {
  if (!room.value) return
  uni.showModal({
    title: '退出宿舍',
    content: `确定要退出「${room.value.room_name}」吗？`,
    confirmColor: '#FF5A5F',
    success: async (res) => {
      if (!res.confirm || !room.value) return
      try {
        await leaveRoom(room.value.id)
        roomStore.handleLeaveRoom(room.value.id)
        uni.showToast({ title: '已退出', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      } catch {
        // handled by request interceptor
      }
    },
  })
}

function handleDissolve() {
  if (!room.value) return
  uni.showModal({
    title: '解散宿舍',
    content: `确定要解散「${room.value.room_name}」吗？此操作不可恢复，所有成员将被移除。`,
    confirmColor: '#FF5A5F',
    success: async (res) => {
      if (!res.confirm || !room.value) return
      try {
        await deleteRoom(room.value.id)
        roomStore.handleLeaveRoom(room.value.id)
        uni.showToast({ title: '已解散', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      } catch {
        // handled by request interceptor
      }
    },
  })
}

function goMembers() { uni.navigateTo({ url: '/pages/room/members' }) }
function goCreateRoom() {
  requireLogin(() => uni.navigateTo({ url: '/pages/room/create' }))
}
function goJoinRoom() {
  requireLogin(() => uni.navigateTo({ url: '/pages/room/join' }))
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.room-detail-page {
  padding: $space-4;
  min-height: 100vh;
  background: $bg-page;
}

.empty-room {
  text-align: center;
  padding: $space-14 $space-8;
  margin-top: $space-12;
  background: $bg-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;

  .empty-icon {
    margin-bottom: $space-7;
    position: relative;

    .empty-img {
      width: 72rpx;
      height: 72rpx;
      opacity: 0.7;
    }

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      background: rgba($primary, 0.06);
      z-index: 0;
    }
  }

  .empty-title {
    font-size: $font-lg;
    font-weight: 700;
    color: $text-primary;
    display: block;
    margin-bottom: $space-4;
  }

  .empty-desc {
    font-size: $font-sm;
    color: $text-secondary;
    display: block;
    margin-bottom: $space-10;
    line-height: 1.6;
  }

  .empty-actions {
    display: flex;
    gap: $space-5;

    button {
      flex: 1;
    }
  }
}

.room-hero {
  background: $bg-card;
  border: 1rpx solid $border-color;
  display: flex;
  align-items: center;
  gap: $space-5;
  padding: $space-5;
  position: relative;
  overflow: hidden;
  box-shadow: $shadow-sm;

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

  .room-hero-bg {
    width: 96rpx;
    height: 96rpx;
    border-radius: $radius-lg;
    background: $primary-gradient;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4rpx 16rpx rgba($primary, 0.2);

    .room-hero-icon {
      width: 52rpx;
      height: 52rpx;
      filter: brightness(0) invert(1);
    }
  }

  .room-hero-content {
    flex: 1;
    min-width: 0;

    .room-name {
      font-size: $font-lg;
      font-weight: 700;
      color: $text-primary;
      display: block;
      margin-bottom: $space-3;
    }

    .room-type-tag {
      display: inline-flex;
      margin-bottom: $space-3;
    }

    .notice-row {
      display: flex;
      align-items: flex-start;
      gap: $space-2;

      .room-notice {
        flex: 1;
        font-size: $font-sm;
        color: $text-secondary;
        line-height: 1.6;
      }

      .edit-hint {
        flex-shrink: 0;
        font-size: $font-xs;
        color: $primary;
      }
    }

    .notice-edit {
      .notice-textarea {
        width: 100%;
        min-height: 120rpx;
        padding: $space-3;
        font-size: $font-sm;
        color: $text-primary;
        background: $bg-page;
        border: 2rpx solid $border-color;
        border-radius: $radius-md;
        box-sizing: border-box;
      }

      .notice-edit-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: $space-3;

        .notice-count {
          font-size: $font-xs;
          color: $text-hint;
        }

        .action-btns {
          display: flex;
          gap: $space-3;

          .btn-sm {
            min-width: 120rpx;
            height: 64rpx;
            line-height: 64rpx;
            font-size: $font-sm;
            margin: 0;
            padding: 0 $space-4;
          }
        }
      }
    }
  }
}

.invite-card {
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-xl;
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

  .invite-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-3;

    .invite-label {
      font-size: $font-sm;
      color: $text-secondary;
      font-weight: 500;
    }

    .invite-hint {
      font-size: $font-xs;
      color: $primary;
    }
  }

  .invite-code {
    font-size: $font-xl;
    font-weight: 800;
    color: $primary;
    letter-spacing: 12rpx;
    text-align: center;
    display: block;
    padding: $space-4 0;
    font-family: 'SF Mono', 'Menlo', monospace;
  }
}

.info-card {
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  position: relative;
  overflow: hidden;
}

.tenancy-entry {
  &:active {
    transform: scale(0.99);
    box-shadow: $shadow-card;
  }

  .tenancy-arrow {
    color: $primary;
    font-weight: 600;
  }

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

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-4 0;

    &:not(:last-child) {
      border-bottom: 1rpx solid $border-light;
    }

    .info-label {
      font-size: $font-sm;
      color: $text-hint;
    }

    .info-value {
      font-size: $font-base;
      color: $text-primary;
      font-weight: 500;
    }
  }
}

.actions {
  margin-top: $space-6;

  .action-btn {
    margin-top: $space-3;
  }
}

.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8rpx);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.picker {
  width: 100%;
  background-color: $bg-card;
  border-radius: $radius-xl $radius-xl 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.12);

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-5 $space-5 $space-4;
    border-bottom: 1rpx solid $border-light;

    .picker-title {
      font-size: $font-md;
      font-weight: 600;
      color: $text-primary;
    }

    .picker-close {
      width: 32rpx;
      height: 32rpx;
      padding: $space-2;
    }
  }

  .picker-list {
    flex: 1;
    max-height: 50vh;
  }

  .picker-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-4 $space-5;
    transition: $transition-fast;

    &:active {
      background-color: $bg-hover;
    }

    .picker-item-info {
      flex: 1;

      .picker-item-name {
        font-size: $font-base;
        color: $text-primary;
        font-weight: 500;
      }
    }

    .picker-item-loading {
      flex-shrink: 0;
    }
  }

  .picker-empty {
    padding: $space-10 $space-5;
    text-align: center;

    .empty-text {
      font-size: $font-sm;
      color: $text-hint;
    }
  }
}
</style>

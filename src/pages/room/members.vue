<template>
  <view class="members-page">
    <view class="page-header">
      <view class="page-header-left">
        <image class="page-header-icon" src="/static/icons/users.png" mode="aspectFit" />
        <text class="page-title">成员管理</text>
      </view>
      <text v-if="members.length > 0" class="member-count">共 {{ members.length }} 人</text>
    </view>

    <view class="member-list" v-if="members.length > 0">
      <view
        class="member-item slide-up"
        v-for="(member, index) in members"
        :key="member.id"
        :style="{ animationDelay: index * 40 + 'ms' }"
      >
        <view class="member-left">
          <MemberAvatar :avatar="member.avatar" :nickname="member.nickname" />
          <view class="member-info">
            <view class="member-info-top">
              <text class="member-name">{{ member.nickname }}</text>
              <view class="role-tag" :class="roleClass(member.role)">{{ roleText(member.role) }}</view>
            </view>
          </view>
        </view>
        <view class="member-actions" v-if="isOwner && member.role !== 2">
          <text class="remove-btn" @click="handleRemove(member.user_id)">移除</text>
        </view>
      </view>
    </view>

    <EmptyState v-if="members.length === 0 && !loading" text="暂无成员" title="成员列表为空" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRoomStore } from '@/stores/room'
import { useAuthStore } from '@/stores/auth'
import { getMembers, removeMember } from '@/api/room'
import MemberAvatar from '@/components/MemberAvatar.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Member } from '@/types/room'

const roomStore = useRoomStore()
const authStore = useAuthStore()
const members = ref<Member[]>([])
const loading = ref(false)

const isOwner = computed(() => roomStore.currentRoom?.owner_id === authStore.userInfo?.id)

const roleMap: Record<number, string> = { 0: '成员', 1: '管理员', 2: '宿舍长' }
function roleText(role: number) { return roleMap[role] || '成员' }
function roleClass(role: number) {
  if (role === 2) return 'role-owner'
  if (role === 1) return 'role-admin'
  return 'role-member'
}

onShow(async () => {
  const roomId = roomStore.currentRoom?.id
  if (roomId) {
    loading.value = true
    try {
      const res = await getMembers(roomId)
      members.value = res.data
    } finally {
      loading.value = false
    }
  }
})

async function handleRemove(userId: number) {
  uni.showModal({
    title: '确认',
    content: '确定移除该成员？',
    success: async (res) => {
      if (res.confirm && roomStore.currentRoom) {
        await removeMember(roomStore.currentRoom.id, userId)
        members.value = members.value.filter(m => m.user_id !== userId)
        uni.showToast({ title: '已移除', icon: 'success' })
      }
    },
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.members-page {
  min-height: 100vh;
  background: $bg-page;
  padding: $space-3 $space-4 $space-6;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
  padding: 0 $space-1;

  .page-header-left {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  .page-header-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .page-title {
    font-size: $font-md;
    font-weight: 700;
    color: $text-primary;
  }

  .member-count {
    font-size: $font-sm;
    color: $text-hint;
  }
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  transition: $transition-fast;

  &:active {
    transform: scale(0.98);
    opacity: 0.92;
  }

  .member-left {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: $space-3;

    :deep(.avatar-img),
    :deep(.avatar-placeholder) {
      width: 72rpx;
      height: 72rpx;
      font-size: $font-sm;
    }
  }

  .member-info {
    flex: 1;
    min-width: 0;
  }

  .member-info-top {
    display: flex;
    align-items: center;
    gap: $space-2;
    flex-wrap: wrap;
  }

  .member-name {
    font-size: $font-base;
    font-weight: 600;
    color: $text-primary;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 280rpx;
  }

  .role-tag {
    flex-shrink: 0;
    font-size: 20rpx;
    font-weight: 500;
    padding: 2rpx $space-2;
    border-radius: $radius-full;
    line-height: 1.4;

    &.role-owner {
      background-color: $primary-bg;
      color: $primary;
    }

    &.role-admin {
      background-color: $warning-bg;
      color: $warning;
    }

    &.role-member {
      background-color: $bg-hover;
      color: $text-hint;
    }
  }

  .remove-btn {
    flex-shrink: 0;
    font-size: $font-sm;
    color: $danger;
    padding: $space-1 $space-2;
    border-radius: $radius-sm;

    &:active {
      background-color: $danger-bg;
    }
  }
}
</style>

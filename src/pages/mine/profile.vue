<template>
  <view class="page">
    <text class="ui-form-label">个人资料</text>
    <view class="ui-form-group">
      <view class="ui-row avatar-row" @click="chooseAvatar">
        <text class="ui-row__label">头像</text>
        <view class="ui-row__value">
          <image v-if="avatarPreview" :src="avatarPreview" class="avatar-img" mode="aspectFill" />
          <view v-else class="avatar-placeholder"><text class="avatar-placeholder__text">{{ nicknameFirst }}</text></view>
          <view class="ui-row__arrow"></view>
        </view>
      </view>
      <view class="ui-field">
        <text class="ui-field__label">昵称</text>
        <input v-model="nickname" class="ui-input" placeholder="请输入昵称" maxlength="20" />
      </view>
    </view>

    <view class="ui-bottom-spacer"></view>
    <view class="ui-bottom-bar">
      <view class="ui-btn ui-btn--primary" :class="{ 'is-disabled': !nickname.trim() || saving }" @click="nickname.trim() && !saving && handleSave()">
        {{ saving ? '保存中...' : '保存' }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { resolveImageUrl } from '@/api/request'

const authStore = useAuthStore()

const nickname = ref(authStore.userInfo?.nickname || '')
const avatarPreview = ref(resolveImageUrl(authStore.userInfo?.avatar || ''))
const avatarBase64 = ref('')
const saving = ref(false)

const nicknameFirst = computed(() => nickname.value ? nickname.value.charAt(0) : '?')

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const path = res.tempFilePaths[0]
      avatarPreview.value = path
      // #ifdef MP-WEIXIN
      const fs = uni.getFileSystemManager()
      fs.readFile({
        filePath: path,
        encoding: 'base64',
        success: (readRes) => {
          avatarBase64.value = readRes.data as string
        },
      })
      // #endif
    },
  })
}

async function handleSave() {
  if (!nickname.value.trim() || saving.value) return
  saving.value = true
  try {
    const data: { nickname: string; avatar_base64?: string } = {
      nickname: nickname.value.trim(),
    }
    if (avatarBase64.value) {
      data.avatar_base64 = avatarBase64.value
    }
    await authStore.updateProfile(data)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1000)
  } catch {
    // handled by store/request
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page {
  min-height: 100vh;
  background: $bg-page;
  padding-top: $space-1;
}

.avatar-row {
  min-height: 128rpx;
}

.avatar-img,
.avatar-placeholder {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar-placeholder {
  background: $primary;
  display: flex;
  align-items: center;
  justify-content: center;

  &__text {
    font-size: $font-md;
    font-weight: 600;
    line-height: 1;
    color: $text-white;
  }
}
</style>

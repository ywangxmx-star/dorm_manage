<template>
  <view class="profile-page">
    <view class="form card slide-up">
      <!-- 头像 -->
      <view class="avatar-section" @click="chooseAvatar">
        <text class="section-label">头像</text>
        <view class="avatar-right">
          <image v-if="avatarPreview" :src="avatarPreview" class="avatar-img" mode="aspectFill" />
          <view v-else class="avatar-placeholder">
            <text>{{ nicknameFirst }}</text>
          </view>
          <image class="arrow-img" src="/static/icons/chevron-right.png" mode="aspectFill" />
        </view>
      </view>

      <!-- 昵称 -->
      <view class="field-section">
        <text class="section-label">昵称</text>
        <input v-model="nickname" class="field-input" placeholder="请输入昵称" maxlength="20" />
      </view>
    </view>

    <button class="btn-primary save-btn" :class="{ 'is-loading': saving }" :disabled="!nickname.trim()" @click="handleSave">
      <text v-if="!saving">保存</text>
      <view v-else class="loading-spinner spinner-sm"></view>
    </button>
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

.profile-page {
  padding: $space-4;
  min-height: 100vh;
  background: $bg-page;
}

.form {
  padding: 0;
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
}

.avatar-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-5;
  border-bottom: 1rpx solid $border-light;

  .section-label {
    font-size: $font-base;
    color: $text-primary;
    font-weight: 500;
  }

  .avatar-right {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  .avatar-img {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    border: 2rpx solid $border-light;
  }

  .avatar-placeholder {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary-light, $primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-white;
    font-size: $font-md;
    font-weight: 600;
  }

  .arrow-img {
    width: 32rpx;
    height: 32rpx;
  }
}

.field-section {
  display: flex;
  align-items: center;
  padding: $space-5;

  .section-label {
    font-size: $font-base;
    color: $text-primary;
    font-weight: 500;
    width: 120rpx;
    flex-shrink: 0;
  }

  .field-input {
    flex: 1;
    font-size: $font-base;
    color: $text-primary;
    text-align: right;
  }
}

.save-btn {
  margin-top: $space-5;
}
</style>

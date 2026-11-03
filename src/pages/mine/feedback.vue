<template>
  <view class="feedback-page">
    <view class="form card slide-up">
      <FormSection label="反馈内容" required>
        <textarea
          v-model="content"
          class="textarea-field"
          placeholder="请详细描述您遇到的问题或建议"
          placeholder-style="font-size: 32rpx; line-height: 44rpx; color: #9AA8BC"
          maxlength="500"
        />
        <text class="char-count">{{ content.length }}/500</text>
      </FormSection>
      <FormSection label="截图（可选）" description="最多上传3张图片">
        <view class="image-grid">
          <view v-for="(img, idx) in images" :key="idx" class="image-wrap">
            <image :src="img" class="preview-img" mode="aspectFill" />
            <view class="remove-btn" @click.stop="removeImage(idx)">×</view>
          </view>
          <view v-if="images.length < 3" class="upload-area" @click="chooseImage">
            <image class="upload-icon-img" src="/static/icons/upload.png" mode="aspectFill" />
            <text class="upload-text">上传图片</text>
          </view>
        </view>
      </FormSection>
    </view>
    <button class="btn-primary submit-btn" :class="{ 'is-loading': submitting }" :disabled="!content.trim()" @click="handleSubmit">
      <text v-if="!submitting">提交反馈</text>
      <view v-else class="loading-spinner spinner-sm"></view>
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { submitFeedback } from '@/api/feedback'
import { useRequireLogin } from '@/composables/useRequireLogin'
import FormSection from '@/components/FormSection.vue'

const { requireLogin } = useRequireLogin()

const content = ref('')
const images = ref<string[]>([])
const submitting = ref(false)

function chooseImage() {
  uni.chooseImage({
    count: 3 - images.value.length,
    success: (res) => {
      images.value.push(...res.tempFilePaths)
    },
  })
}

function removeImage(idx: number) {
  images.value.splice(idx, 1)
}

async function pathToBase64(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath: path,
      encoding: 'base64',
      success: (res) => resolve(res.data as string),
      fail: reject,
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('not supported'))
    // #endif
  })
}

async function handleSubmit() {
  if (!content.value.trim() || submitting.value) return
  requireLogin(async () => {
  submitting.value = true
  try {
    const base64Images: string[] = []
    for (const img of images.value) {
      const b64 = await pathToBase64(img)
      base64Images.push(b64)
    }
    await submitFeedback({ content: content.value, images: base64Images })
    uni.showToast({ title: '感谢您的反馈', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch { /* handled */ } finally {
    submitting.value = false
  }
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.feedback-page {
  padding: $space-4;
  min-height: 100vh;
  background: $bg-page;
}

.form {
  padding: $space-5 $space-5 $space-2;
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

.textarea-field {
  height: 200rpx;
  line-height: 44rpx;
}

.char-count {
  display: block;
  text-align: right;
  font-size: $font-xs;
  color: $text-hint;
  margin-top: $space-1;
}

.image-grid {
  display: flex;
  gap: $space-3;
  flex-wrap: wrap;
}

.upload-area {
  width: 180rpx;
  height: 180rpx;
  border: 2rpx dashed $primary;
  border-radius: $radius-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  transition: $transition-fast;
  background-color: $primary-bg;

  &:active {
    transform: scale(0.95);
  }

  .upload-icon-img {
    width: 48rpx;
    height: 48rpx;
  }

  .upload-text {
    font-size: $font-xs;
    color: $primary;
    font-weight: 500;
  }
}

.image-wrap {
  position: relative;
  width: 180rpx;
  height: 180rpx;

  .preview-img {
    width: 100%;
    height: 100%;
    border-radius: $radius-lg;
  }

  .remove-btn {
    position: absolute;
    top: -12rpx;
    right: -12rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background-color: $danger;
    color: $text-white;
    font-size: $font-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-sm;
  }
}

.submit-btn {
  margin-top: $space-5;
}
</style>

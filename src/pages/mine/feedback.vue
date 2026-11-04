<template>
  <view class="page">
    <text class="ui-form-label">反馈内容<text class="req">*</text></text>
    <view class="ui-form-group">
      <view class="ui-field">
        <textarea
          v-model="content"
          class="ui-textarea feedback-textarea"
          placeholder="请详细描述您遇到的问题或建议"
          maxlength="500"
        />
        <text class="char-count num">{{ content.length }}/500</text>
      </view>
    </view>

    <text class="ui-form-label">截图<text class="label-sub"> · 选填，最多 3 张</text></text>
    <view class="ui-form-group">
      <view class="image-grid">
        <view v-for="(img, idx) in images" :key="idx" class="image-cell">
          <image :src="img" class="image-cell__img" mode="aspectFill" />
          <view class="image-cell__remove" aria-label="移除图片" @click.stop="removeImage(idx)">
            <view class="x-mark"></view>
          </view>
        </view>
        <view v-if="images.length < 3" class="image-cell image-cell--add" @click="chooseImage">
          <view class="plus-mark"></view>
          <text class="add-text">上传图片</text>
        </view>
      </view>
    </view>

    <view class="ui-bottom-spacer"></view>
    <view class="ui-bottom-bar">
      <view class="ui-btn ui-btn--primary" :class="{ 'is-disabled': !content.trim() || submitting }" @click="content.trim() && !submitting && handleSubmit()">
        {{ submitting ? '提交中...' : '提交反馈' }}
      </view>
    </view>
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

.page {
  min-height: 100vh;
  background: $bg-page;
  padding-top: $space-1;
}

.req {
  color: $danger;
  margin-left: 4rpx;
}

.label-sub {
  color: $text-hint;
  font-weight: 400;
}

.feedback-textarea {
  height: 240rpx;
}

.char-count {
  display: block;
  padding-bottom: $space-2;
  text-align: right;
  font-size: 22rpx;
  color: $text-hint;
  line-height: 1;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-3 0;
}

.image-cell {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  border-radius: $radius-sm;
  overflow: hidden;
  background: $bg-subtle;
  box-sizing: border-box;

  &__img {
    width: 100%;
    height: 100%;
  }

  &__remove {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &--add {
    border: 2rpx dashed $border-color;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-1;

    &:active { background: $bg-hover; }
  }
}

.x-mark {
  position: relative;
  width: 18rpx;
  height: 18rpx;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 3rpx;
    margin-top: -1.5rpx;
    background: $text-white;
  }

  &::before { transform: rotate(45deg); }
  &::after { transform: rotate(-45deg); }
}

.plus-mark {
  position: relative;
  width: 36rpx;
  height: 36rpx;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: $text-hint;
    border-radius: 2rpx;
  }

  &::before { top: 50%; left: 0; width: 100%; height: 4rpx; margin-top: -2rpx; }
  &::after { left: 50%; top: 0; height: 100%; width: 4rpx; margin-left: -2rpx; }
}

.add-text {
  font-size: 22rpx;
  color: $text-hint;
  line-height: 1;
}
</style>

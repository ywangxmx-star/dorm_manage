<template>
  <view class="ui-page">
    <view class="ui-header">
      <text class="ui-header__title">提交完成</text>
      <text class="ui-header__sub">留个备注或拍张照，方便宿舍长确认</text>
    </view>

    <text class="ui-form-label">完成备注</text>
    <view class="ui-form-group">
      <view class="ui-field">
        <textarea v-model="remark" class="ui-textarea" placeholder="比如：垃圾已倒，顺便擦了桌子（选填）" maxlength="200" />
      </view>
    </view>

    <view class="label-row">
      <text class="ui-form-label">现场照片</text>
      <text class="label-extra num">{{ images.length }}/3</text>
    </view>
    <view class="ui-form-group photo-group">
      <view class="image-grid">
        <view v-for="(img, idx) in images" :key="idx" class="image-cell">
          <image :src="img" class="preview-img" mode="aspectFill" />
          <view class="remove-btn" aria-label="删除照片" @click.stop="removeImage(idx)">
            <view class="remove-btn__x"></view>
          </view>
        </view>
        <view v-if="images.length < 3" class="image-cell upload-area" @click="chooseImage">
          <view class="upload-plus"></view>
          <text class="upload-text">添加照片</text>
        </view>
      </view>
    </view>

    <view class="ui-bottom-spacer"></view>
    <view class="ui-bottom-bar">
      <view class="ui-btn ui-btn--primary" :class="{ 'is-disabled': submitting }" @click="handleSubmit">
        <view v-if="submitting" class="loading-spinner spinner-sm btn-spinner"></view>
        <text>{{ submitting ? '提交中...' : '提交完成' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { completeTask } from '@/api/task'

let taskId = 0
const remark = ref('')
const images = ref<string[]>([])
const submitting = ref(false)

onLoad((options) => { taskId = Number(options?.id) })

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
  if (submitting.value) return
  submitting.value = true
  try {
    const finishImages: string[] = []
    for (const img of images.value) {
      finishImages.push(await pathToBase64(img))
    }
    await completeTask(taskId, { finish_images: finishImages, finish_remark: remark.value })
    uni.showToast({ title: '已提交', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch { /* handled */ } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: $page-gutter;
}

.label-extra {
  font-size: $font-xs;
  color: $text-secondary;
}

.photo-group {
  padding-top: $space-4;
  padding-bottom: $space-4;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-2;
}

.image-cell {
  position: relative;
  width: 100%;
  padding-top: 100%;
  border-radius: $radius-sm;
  overflow: hidden;
  background: $bg-subtle;
}

.preview-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.remove-btn {
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

  &__x {
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
      border-radius: 2rpx;
    }

    &::before { transform: rotate(45deg); }
    &::after { transform: rotate(-45deg); }
  }
}

.upload-area {
  border: 1rpx dashed $border-color;
  box-sizing: border-box;
}

.upload-plus {
  position: absolute;
  top: 38%;
  left: 50%;
  width: 36rpx;
  height: 36rpx;
  transform: translate(-50%, -50%);

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: $text-secondary;
    border-radius: 2rpx;
  }

  &::before { top: 50%; left: 0; width: 100%; height: 3rpx; margin-top: -1.5rpx; }
  &::after { left: 50%; top: 0; height: 100%; width: 3rpx; margin-left: -1.5rpx; }
}

.upload-text {
  position: absolute;
  left: 0;
  right: 0;
  top: 62%;
  text-align: center;
  font-size: $font-xs;
  color: $text-secondary;
  line-height: 1;
}

.btn-spinner {
  border-color: rgba(255, 255, 255, 0.35);
  border-top-color: $text-white;
}
</style>

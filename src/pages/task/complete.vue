<template>
  <view class="complete-page">
    <view class="intro">
      <view class="intro-badge">DONE</view>
      <text class="intro-title">任务搞定了？</text>
      <text class="intro-sub">留个备注或拍张照，方便宿舍长确认</text>
    </view>

    <text class="ui-form-label">完成备注</text>
    <view class="ui-form-group">
      <textarea v-model="remark" class="remark" placeholder="比如：垃圾已倒，顺便擦了桌子（选填）" />
    </view>

    <view class="label-row">
      <text class="ui-form-label">现场照片</text>
      <text class="label-extra">{{ images.length }}/3</text>
    </view>
    <view class="image-grid">
      <view v-for="(img, idx) in images" :key="idx" class="image-wrap">
        <image :src="img" class="preview-img" mode="aspectFill" />
        <view class="remove-btn" @click.stop="removeImage(idx)">×</view>
      </view>
      <view v-if="images.length < 3" class="upload-area" @click="chooseImage">
        <image src="/static/icons/upload.png" class="upload-icon" />
        <text class="upload-text">添加照片</text>
      </view>
    </view>

    <view class="ui-bottom-spacer"></view>
    <view class="ui-bottom-bar">
      <view class="ui-btn ui-btn--primary" :class="{ 'is-disabled': submitting }" @click="handleSubmit">
        <text v-if="!submitting">提交完成</text>
        <view v-else class="loading-spinner spinner-sm"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { completeTask } from '@/api/task'
import FormSection from '@/components/FormSection.vue'

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

.complete-page {
  min-height: 100vh;
  background: $bg-page;
  padding-top: $space-5;
}

.intro {
  padding: 0 $space-5 $space-3;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8rpx;

  &-badge {
    padding: 6rpx 20rpx;
    border-radius: $radius-full;
    background: $accent-lemon;
    color: $text-primary;
    font-size: 22rpx;
    font-weight: 900;
    letter-spacing: 0.1em;
    transform: rotate(-4deg);
  }

  &-title {
    margin-top: $space-2;
    font-size: 48rpx;
    font-weight: 900;
    color: $text-primary;
  }

  &-sub {
    font-size: $font-sm;
    color: $text-secondary;
  }
}

.remark {
  width: 100%;
  height: 220rpx;
  padding: $space-2 0;
  font-size: $font-sm;
  color: $text-primary;
  line-height: 1.6;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: $space-5;
}

.label-extra {
  font-size: $font-xs;
  font-weight: 700;
  color: $primary;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  padding: 0 $space-5;
}

.image-wrap,
.upload-area {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: $radius-lg;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.remove-btn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(21, 34, 56, 0.6);
  color: $text-white;
  font-size: 32rpx;
  line-height: 40rpx;
  text-align: center;
}

.upload-area {
  background: $bg-card;
  border: 3rpx dashed $primary-lighter;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  box-sizing: border-box;
}

.upload-icon {
  width: 48rpx;
  height: 48rpx;
}

.upload-text {
  font-size: $font-xs;
  font-weight: 600;
  color: $primary;
}
</style>

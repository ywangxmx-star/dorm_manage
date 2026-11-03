<template>
  <view class="complete-page">
    <view class="form card slide-up">
      <FormSection label="完成备注">
        <textarea v-model="remark" class="textarea-field" placeholder="填写完成备注（可选）" />
      </FormSection>
      <FormSection label="完成截图" description="最多上传3张图片">
        <view class="image-grid">
          <view v-for="(img, idx) in images" :key="idx" class="image-wrap">
            <image :src="img" class="preview-img" mode="aspectFill" />
            <view class="remove-btn" @click.stop="removeImage(idx)">×</view>
          </view>
          <view v-if="images.length < 3" class="upload-area" @click="chooseImage">
            <image src="/static/icons/upload.png" class="upload-icon-img" />
            <text class="upload-text">上传图片</text>
          </view>
        </view>
      </FormSection>
    </view>
    <button class="btn-primary submit-btn" :class="{ 'is-loading': submitting }" @click="handleSubmit">
      <text v-if="!submitting">提交完成</text>
      <view v-else class="loading-spinner spinner-sm"></view>
    </button>
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
    width: 40rpx;
    height: 40rpx;
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

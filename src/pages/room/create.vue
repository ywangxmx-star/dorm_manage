<template>
  <view class="create-room-page">
    <view class="form card slide-up">
      <FormSection label="宿舍名称" required>
        <input v-model="form.room_name" class="input-field" placeholder="请输入宿舍名称" maxlength="64" />
      </FormSection>
      <FormSection label="宿舍公告" description="向成员展示的重要信息">
        <textarea v-model="form.notice" class="textarea-field" placeholder="请输入公告" maxlength="200" />
      </FormSection>
      <FormSection label="最大人数">
        <picker :range="memberOptions" :value="memberIndex" @change="onMemberChange">
          <view class="picker-display">
            <text>{{ memberOptions[memberIndex] }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </FormSection>
      <FormSection label="宿舍类型">
        <picker :range="typeOptions" :range-key="'label'" :value="typeIndex" @change="onTypeChange">
          <view class="picker-display">
            <text>{{ typeOptions[typeIndex].label }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </FormSection>
    </view>
    <button class="btn-primary submit-btn" :class="{ 'is-loading': submitting }" :disabled="!form.room_name" @click="handleSubmit">
      <text v-if="!submitting">创建宿舍</text>
      <view v-else class="loading-spinner spinner-sm"></view>
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { createRoom } from '@/api/room'
import { useRoomStore } from '@/stores/room'
import FormSection from '@/components/FormSection.vue'

const roomStore = useRoomStore()
const form = reactive({ room_name: '', notice: '', max_member: 4, room_type: 0 })
const submitting = ref(false)
const memberOptions = ['2人', '3人', '4人', '5人', '6人', '8人']
const memberIndex = ref(2)
const typeOptions = [{ label: '学生宿舍', value: 0 }, { label: '合租', value: 1 }, { label: '员工宿舍', value: 2 }]
const typeIndex = ref(0)

function onMemberChange(e: any) { memberIndex.value = e.detail.value; form.max_member = parseInt(memberOptions[e.detail.value]) }
function onTypeChange(e: any) { typeIndex.value = e.detail.value; form.room_type = typeOptions[e.detail.value].value }

async function handleSubmit() {
  if (!form.room_name || submitting.value) return
  submitting.value = true
  try {
    const res = await createRoom(form)
    roomStore.setCurrentRoom(res.data)
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch { /* handled by request */ } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.create-room-page {
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

  .picker-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 88rpx;
    padding: 0 $space-4;
    font-size: $font-base;
    color: $text-primary;
    background-color: $bg-page;
    border: 2rpx solid $border-color;
    border-radius: $radius-md;
    transition: $transition-fast;

    &:focus-within {
      border-color: $primary;
      box-shadow: 0 0 0 4rpx $primary-bg;
    }

    .picker-arrow {
      font-size: $font-xs;
      color: $text-hint;
    }
  }
}

.submit-btn {
  margin-top: $space-5;
}
</style>

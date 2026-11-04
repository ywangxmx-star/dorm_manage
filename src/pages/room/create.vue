<template>
  <view class="page">
    <text class="ui-form-label">基本信息</text>
    <view class="ui-form-group">
      <view class="ui-field">
        <text class="ui-field__label">宿舍名称<text class="req">*</text></text>
        <input v-model="form.room_name" class="ui-input" placeholder="请输入宿舍名称" maxlength="64" />
      </view>
      <picker :range="memberOptions" :value="memberIndex" @change="onMemberChange">
        <view class="ui-row">
          <text class="ui-row__label">最大人数</text>
          <view class="ui-row__value"><text>{{ memberOptions[memberIndex] }}</text><view class="ui-row__arrow"></view></view>
        </view>
      </picker>
      <picker :range="typeOptions" :range-key="'label'" :value="typeIndex" @change="onTypeChange">
        <view class="ui-row">
          <text class="ui-row__label">宿舍类型</text>
          <view class="ui-row__value"><text>{{ typeOptions[typeIndex].label }}</text><view class="ui-row__arrow"></view></view>
        </view>
      </picker>
    </view>

    <text class="ui-form-label">宿舍公告<text class="label-sub"> · 选填</text></text>
    <view class="ui-form-group">
      <view class="ui-field">
        <textarea v-model="form.notice" class="ui-textarea" placeholder="向成员展示的重要信息" maxlength="200" />
      </view>
    </view>

    <view class="ui-bottom-spacer"></view>
    <view class="ui-bottom-bar">
      <view class="ui-btn ui-btn--primary" :class="{ 'is-disabled': !form.room_name || submitting }" @click="form.room_name && !submitting && handleSubmit()">
        {{ submitting ? '创建中...' : '创建宿舍' }}
      </view>
    </view>
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
</style>

<template>
  <view class="create-vote-page">
    <view class="form-section">
      <view class="form-item">
        <text class="form-label">投票标题</text>
        <input
          v-model="form.title"
          class="form-input"
          placeholder="请输入投票标题"
          placeholder-style="font-size: 32rpx; line-height: 88rpx; color: #94A3B8"
          maxlength="128"
        />
      </view>

      <view class="form-item">
        <text class="form-label">投票描述</text>
        <textarea
          v-model="form.description"
          class="form-textarea"
          placeholder="请输入投票描述（选填）"
          placeholder-style="font-size: 32rpx; line-height: 44rpx; color: #94A3B8"
          :maxlength="500"
        />
      </view>

      <view class="form-item">
        <text class="form-label">投票类型</text>
        <view class="radio-group">
          <view
            v-for="item in VOTE_TYPE_OPTIONS"
            :key="item.value"
            class="radio-item"
            :class="{ active: form.vote_type === item.value }"
            @click="form.vote_type = item.value"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">选择类型</text>
        <view class="radio-group">
          <view
            v-for="item in SELECT_TYPE_OPTIONS"
            :key="item.value"
            class="radio-item"
            :class="{ active: form.select_type === item.value }"
            @click="form.select_type = item.value"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view v-if="form.select_type > 0" class="form-item">
        <text class="form-label">{{ form.select_type === 1 ? '必选数量' : '最多可选数量' }}</text>
        <input
          v-model="form.select_count"
          class="form-input"
          type="number"
          placeholder="请输入数量"
          :min="2"
        />
      </view>

      <view class="form-item">
        <text class="form-label">截止时间</text>
        <picker mode="multiSelector" :range="dateRange" :value="dateValue" @change="onDateChange">
          <view class="form-input picker-input">
            <text class="picker-text">{{ form.deadline }}</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="form-section">
      <view class="section-header-row">
        <text class="form-label">投票选项</text>
        <view class="add-btn" @click="addOption">
          <text class="add-btn-text">+ 添加选项</text>
        </view>
      </view>

      <view v-for="(opt, index) in form.options" :key="index" class="option-item">
        <view class="option-index">
          <text>{{ index + 1 }}</text>
        </view>
        <input
          v-model="opt.content"
          class="form-input option-input"
          :placeholder="`选项${index + 1}`"
          maxlength="256"
        />
        <view v-if="form.options.length > 2" class="remove-btn" @click="removeOption(index)">
          <text class="remove-btn-text">×</text>
        </view>
      </view>
    </view>

    <view class="submit-section">
      <button class="btn-primary" :loading="submitting" @click="handleSubmit">创建投票</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoomStore } from '@/stores/room'
import { createVote } from '@/api/vote'
import { VOTE_TYPE_OPTIONS, SELECT_TYPE_OPTIONS } from '@/constants/vote'

const roomStore = useRoomStore()

const submitting = ref(false)

const now = new Date()

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

function buildDeadline(y: string, m: string, d: string, h: string, min: string) {
  return `${y}-${m}-${d} ${h}:${min}:00`
}

const form = ref({
  title: '',
  description: '',
  vote_type: 0,
  select_type: 0,
  select_count: 2,
  deadline: buildDeadline(
    now.getFullYear().toString(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
    pad2(now.getHours()),
    pad2(now.getMinutes()),
  ),
  options: [
    { content: '', sort_order: 0 },
    { content: '', sort_order: 1 },
  ],
})

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear.toString(), (currentYear + 1).toString()]
})

const months = computed(() => Array.from({ length: 12 }, (_, i) => pad2(i + 1)))

const days = computed(() => {
  const year = years.value[dateValue.value[0]] ? Number(years.value[dateValue.value[0]]) : new Date().getFullYear()
  const month = dateValue.value[1] + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => pad2(i + 1))
})

const hours = computed(() => Array.from({ length: 24 }, (_, i) => pad2(i)))

const minutes = computed(() => Array.from({ length: 60 }, (_, i) => pad2(i)))

const dateRange = computed(() => [years.value, months.value, days.value, hours.value, minutes.value])

const dateValue = ref([
  0,
  now.getMonth(),
  now.getDate() - 1,
  now.getHours(),
  now.getMinutes(),
])

function onDateChange(e: any) {
  const [y, m, d, h, min] = e.detail.value
  const year = years.value[y]
  const month = months.value[m]
  const day = days.value[d]
  const hour = hours.value[h]
  const minute = minutes.value[min]
  form.value.deadline = `${year}-${month}-${day} ${hour}:${minute}:00`
}

function addOption() {
  form.value.options.push({ content: '', sort_order: form.value.options.length })
}

function removeOption(index: number) {
  form.value.options.splice(index, 1)
}

async function handleSubmit() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请输入投票标题', icon: 'none' })
    return
  }

  const validOptions = form.value.options.filter(o => o.content.trim())
  if (validOptions.length < 2) {
    uni.showToast({ title: '至少需要2个选项', icon: 'none' })
    return
  }

  if (form.value.select_type > 0 && form.value.select_count < 2) {
    uni.showToast({ title: '数量不能小于2', icon: 'none' })
    return
  }

  const roomId = roomStore.currentRoom?.id
  if (!roomId) {
    uni.showToast({ title: '请先选择宿舍', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await createVote({
      room_id: roomId,
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      vote_type: form.value.vote_type,
      select_type: form.value.select_type,
      select_count: form.value.select_count,
      deadline: form.value.deadline,
      options: validOptions.map((o, i) => ({ content: o.content.trim(), sort_order: i })),
    })
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.create-vote-page {
  padding: $space-4;
  padding-bottom: 160rpx;
  min-height: 100vh;
  background: $bg-page;
}

.form-section {
  background-color: $bg-card;
  border-radius: $radius-xl;
  padding: $space-5;
  margin-bottom: $space-4;
  box-shadow: $shadow-sm;
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

.form-item {
  margin-bottom: $space-5;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: $font-sm;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $space-3;
  display: block;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background-color: $bg-hover;
  border-radius: $radius-lg;
  padding: 0 $space-4;
  font-size: $font-base;
  line-height: 88rpx;
  color: $text-primary;
  box-sizing: border-box;
  border: 2rpx solid transparent;
  transition: $transition-fast;

  &:focus {
    border-color: $primary;
    background-color: $bg-card;
    box-shadow: 0 0 0 4rpx $primary-bg;
  }
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  background-color: $bg-hover;
  border-radius: $radius-lg;
  padding: $space-3 $space-4;
  font-size: $font-base;
  line-height: 44rpx;
  color: $text-primary;
  box-sizing: border-box;
  border: 2rpx solid transparent;
  transition: $transition-fast;

  &:focus {
    border-color: $primary;
    background-color: $bg-card;
    box-shadow: 0 0 0 4rpx $primary-bg;
  }
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.radio-item {
  padding: $space-2 $space-4;
  border-radius: $radius-full;
  border: 2rpx solid $border-color;
  background-color: $bg-card;
  font-size: $font-sm;
  color: $text-secondary;
  transition: $transition-fast;

  &.active {
    background-color: $primary;
    color: $text-white;
    border-color: $primary;
    box-shadow: 0 4rpx 12rpx rgba($primary, 0.2);
  }
}

.picker-input {
  display: flex;
  align-items: center;
}

.picker-text {
  font-size: $font-base;
  color: $text-primary;
}

.picker-placeholder {
  font-size: $font-base;
  color: $text-hint;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.add-btn {
  padding: $space-2 $space-3;
  background-color: $primary-bg;
  border-radius: $radius-full;
}

.add-btn-text {
  font-size: $font-sm;
  color: $primary;
  font-weight: 500;
}

.option-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-3;

  .option-index {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background: $primary-gradient;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-sm;
    color: $text-white;
    font-weight: 600;
    flex-shrink: 0;
    box-shadow: 0 4rpx 12rpx rgba($primary, 0.2);
  }

  .option-input {
    flex: 1;
  }

  .remove-btn {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background-color: rgba($danger, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: $transition-fast;

    &:active {
      background-color: rgba($danger, 0.2);
    }
  }

  .remove-btn-text {
    font-size: $font-lg;
    color: $danger;
    line-height: 1;
  }
}

.submit-section {
  padding: $space-4 0;
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  background: $primary-gradient;
  color: $text-white;
  border: none;
  border-radius: $radius-xl;
  font-size: $font-md;
  font-weight: 600;
  box-shadow: 0 8rpx 32rpx rgba($primary, 0.3);
  transition: $transition-base;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;

  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }
}
</style>

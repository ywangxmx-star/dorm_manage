<template>
  <view class="create-page">
    <view class="ui-header">
      <text class="ui-header__eyebrow">INSPECT · 发起验房</text>
      <view class="ui-header__row">
        <text class="ui-header__title">选择模板</text>
      </view>
      <text class="ui-header__sub">创建后逐项填写状态、照片与表计读数</text>
    </view>

    <view class="tpl-list">
      <view v-if="templates.length === 0" class="empty-box">
        <PageLoading />
      </view>
      <view
        v-for="t in templates" :key="t.template_key"
        class="card tpl-card"
        @click="create(t.template_key)"
      >
        <view class="tpl-card__title">{{ t.title }}</view>
        <view class="tpl-card__groups">
          <text v-for="g in t.groups" :key="g.group" class="tag tag-primary">{{ g.group }} {{ g.items.length }}项</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getInspectTemplates, createInspect } from '@/api/tenancy'
import PageLoading from '@/components/PageLoading.vue'
import type { InspectTemplate } from '@/types/tenancy'

const roomId = ref(0)
const templates = ref<InspectTemplate[]>([])

onLoad(async (query) => {
  roomId.value = Number(query?.room_id || 0)
  const res = await getInspectTemplates()
  templates.value = res.data || []
})

async function create(templateKey: string) {
  const res = await createInspect({ room_id: roomId.value, template_key: templateKey })
  uni.redirectTo({ url: `/pages/tenancy/inspect/detail?room_id=${roomId.value}&id=${res.data.id}` })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.tpl-list {
  padding: 0 $space-5;
}

.tpl-card {
  margin-bottom: $space-4;

  &__title {
    font-size: $font-base;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: $space-3;
  }

  &__groups {
    display: flex;
    flex-wrap: wrap;
    gap: $space-1;
  }
}
</style>

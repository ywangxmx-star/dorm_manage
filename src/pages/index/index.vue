<template>
  <view />
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'

function goHome() {
  uni.switchTab({
    url: '/pages/home/index',
    fail: () => uni.reLaunch({ url: '/pages/home/index' }),
  })
}

onLoad(goHome)
</script>

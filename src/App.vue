<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'

function checkMiniProgramUpdate() {
  // #ifdef MP-WEIXIN
  const updateManager = uni.getUpdateManager()

  updateManager.onCheckForUpdate((res) => {
    if (res.hasUpdate) {
      uni.showLoading({ title: '发现新版本，下载中...', mask: true })
    }
  })

  updateManager.onUpdateReady(() => {
    uni.hideLoading()
    uni.showModal({
      title: '更新提示',
      content: '新版本已准备好，需重启应用完成更新',
      showCancel: false,
      confirmText: '立即更新',
      success: (modalRes) => {
        if (modalRes.confirm) {
          updateManager.applyUpdate()
        }
      },
    })
  })

  updateManager.onUpdateFailed(() => {
    uni.hideLoading()
    uni.showModal({
      title: '更新失败',
      content: '新版本下载失败，请删除小程序后重新搜索进入',
      showCancel: false,
      confirmText: '知道了',
    })
  })
  // #endif
}

onLaunch(() => {
  checkMiniProgramUpdate()

  const authStore = useAuthStore()
  authStore.checkLogin()
})
</script>

<style lang="scss">
@use '@/styles/global.scss';
</style>

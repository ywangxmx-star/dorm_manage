<template>
  <scroll-view class="agreement-page" scroll-y>
    <view class="agreement-content">
      <text class="agreement-title">隐私政策</text>
      <text class="agreement-updated">更新日期：2026年5月26日</text>

      <view v-for="section in sections" :key="section.title" class="section">
        <text class="section-title">{{ section.title }}</text>
        <text v-for="(para, i) in section.paragraphs" :key="i" class="section-para">{{ para }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
const sections = [
  {
    title: '一、我们收集的信息',
    paragraphs: [
      '为向您提供登录、宿舍协作、任务、账单、投票等服务，我们可能收集：微信昵称、头像、openid，以及您在使用功能时主动填写的宿舍名称、任务、账单、投票等内容。',
      '我们不会收集与服务无关的信息，遵循最小必要原则。',
    ],
  },
  {
    title: '二、信息的使用',
    paragraphs: [
      '收集的信息用于账号识别、宿舍成员协作、功能展示与改进、安全保障及法律法规要求的用途。',
      '未经您同意，我们不会将您的个人信息出售给第三方。',
    ],
  },
  {
    title: '三、信息的存储与保护',
    paragraphs: [
      '我们采取合理的技术与管理措施保护您的个人信息安全。',
      '在实现服务目的所必需的期限内保存您的信息，法律法规另有规定的除外。',
    ],
  },
  {
    title: '四、您的权利',
    paragraphs: [
      '您有权查询、更正、删除您的个人信息，或撤回授权。可通过应用内「意见反馈」联系我们处理。',
      '您拒绝提供非必要信息时，可能无法使用对应功能，但不影响您使用无需该信息的其他功能。',
    ],
  },
  {
    title: '五、未成年人保护',
    paragraphs: [
      '若您为未成年人，请在监护人指导下阅读本政策并使用本服务。',
    ],
  },
  {
    title: '六、政策更新',
    paragraphs: [
      '我们可能适时修订本政策，修订后将在应用内公布。若您继续使用本服务，视为接受修订后的政策。',
    ],
  },
  {
    title: '七、联系我们',
    paragraphs: [
      '如对本政策有疑问，请通过应用内「意见反馈」与我们联系。',
    ],
  },
]
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.agreement-page {
  height: 100vh;
  background: $bg-page;
}

.agreement-content {
  padding: $space-5 $space-4 $space-8;
}

.agreement-title {
  display: block;
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $space-2;
}

.agreement-updated {
  display: block;
  font-size: $font-xs;
  color: $text-hint;
  margin-bottom: $space-6;
}

.section {
  margin-bottom: $space-5;
}

.section-title {
  display: block;
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $space-3;
}

.section-para {
  display: block;
  font-size: $font-sm;
  color: $text-secondary;
  line-height: 1.7;
  margin-bottom: $space-3;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>

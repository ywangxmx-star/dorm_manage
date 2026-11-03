<template>
  <scroll-view class="agreement-page" scroll-y>
    <view class="agreement-content">
      <text class="agreement-title">用户协议</text>
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
    title: '一、总则',
    paragraphs: [
      '欢迎使用「舍小圈」（以下简称「本服务」）。本协议是您与运营方之间关于使用本服务所订立的协议。登录或使用本服务，即表示您已阅读并同意本协议。',
      '本服务面向宿舍、合租等场景，提供任务协作、账单分摊、投票等功能。您应保证所提供信息真实、合法。',
    ],
  },
  {
    title: '二、账号与安全',
    paragraphs: [
      '您可通过微信授权登录使用本服务。请妥善保管账号及设备，因您自身原因导致的账号风险由您自行承担。',
      '如发现账号被盗用或存在异常，请及时通过意见反馈联系我们。',
    ],
  },
  {
    title: '三、用户行为规范',
    paragraphs: [
      '您不得利用本服务从事违法违规活动，不得发布虚假、侵权、骚扰、色情、暴力等内容。',
      '您创建或加入的宿舍内数据（任务、账单、投票等）由宿舍成员共同使用，请尊重其他成员权益，合理发布信息。',
    ],
  },
  {
    title: '四、服务内容与变更',
    paragraphs: [
      '我们有权根据业务需要调整功能，并尽可能提前通知。因系统维护、升级等导致的服务中断，我们将尽力减少影响。',
      '对于免费功能，我们保留调整、暂停或终止的权利，法律法规另有规定的除外。',
    ],
  },
  {
    title: '五、隐私与数据',
    paragraphs: [
      '为提供登录、宿舍协作等功能，我们会收集必要的用户信息（如微信昵称、头像、宿舍相关数据）。具体规则以隐私政策及法律法规为准。',
      '除法律法规要求或经您同意外，我们不会向第三方出售您的个人信息。',
    ],
  },
  {
    title: '六、免责声明',
    paragraphs: [
      '宿舍成员之间的账单分摊、投票结果等由用户自行确认，本服务仅提供记录与展示工具，不构成财务或法律建议。',
      '因不可抗力、网络故障、第三方服务异常等导致的服务中断或数据损失，我们在法律允许范围内不承担责任。',
    ],
  },
  {
    title: '七、协议变更与终止',
    paragraphs: [
      '我们可能修订本协议，修订后将在应用内公布。若您继续使用本服务，视为接受修订后的协议。',
      '您可随时停止使用本服务。我们亦可在您严重违反本协议时限制或终止向您提供服务。',
    ],
  },
  {
    title: '八、联系我们',
    paragraphs: [
      '如对本协议有疑问，请通过应用内「意见反馈」与我们联系。',
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

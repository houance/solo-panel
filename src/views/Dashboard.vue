<template>
  <div class="dashboard">
    <n-card title="仪表板">
      <n-grid cols="1 s:2 m:3 l:4" responsive="screen" :x-gap="16" :y-gap="16">
        <n-grid-item>
          <n-statistic label="总用户数" :value="12567">
            <template #prefix>
              <n-icon>
                <PeopleOutline />
              </n-icon>
            </template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="总订单数" :value="8923">
            <template #prefix>
              <n-icon>
                <ListOutline />
              </n-icon>
            </template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="总收入" :value="1256700">
            <template #prefix>
              <n-icon>
                <CashOutline />
              </n-icon>
            </template>
            <template #suffix>
              元
            </template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="今日活跃" :value="3245">
            <template #prefix>
              <n-icon>
                <PulseOutline />
              </n-icon>
            </template>
          </n-statistic>
        </n-grid-item>
      </n-grid>

      <n-divider />

      <div class="welcome-section">
        <h3>欢迎使用管理后台</h3>
        <p>这是一个基于 Vue3 + TypeScript + Naive UI 构建的简单管理面板</p>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard, NGrid, NGridItem, NStatistic, NIcon, NDivider } from 'naive-ui'
import {
  PeopleOutline,
  ListOutline,
  CashOutline,
  PulseOutline
} from '@vicons/ionicons5'
</script>

<style scoped>
.dashboard {
  min-height: 100%;
}

.welcome-section {
  text-align: center;
  padding: 40px 0;
}

.welcome-section h3 {
  margin-bottom: 16px;
  color: #333;
}

.welcome-section p {
  color: #666;
  font-size: 16px;
}
</style>
<template>
  <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
  >
    <div class="logo-container">
      <h2 v-if="!collapsed" class="logo-text">Flow Stack</h2>
      <h2 v-else class="logo-text">FS</h2>
    </div>

    <n-menu
        v-model:value="activeKey"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleMenuSelect"
    />
  </n-layout-sider>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NLayoutSider, NMenu } from 'naive-ui'
import {
  HomeOutline,
  AnalyticsOutline,
  SaveOutline
} from '@vicons/ionicons5'
import { renderIcon } from '../../utils/iconRenderer'

// 路由实例
const router = useRouter()
const route = useRoute()

// 响应式数据
const collapsed = ref(false)
const activeKey = ref(route.name as string)

// 图标映射
const iconMap: Record<string, Component> = {
  dashboard: HomeOutline,
  jobFlow: AnalyticsOutline,
  restic: SaveOutline,
}

// 从路由生成菜单选项
const menuOptions = computed(() => {
  return router.getRoutes()
      .filter(route => route.meta?.title && route.meta?.icon)
      .map(route => {
        const iconKey = route.meta.icon as string;
        const iconComponent = iconMap[iconKey];

        // 确保图标组件存在，如果不存在则使用默认图标
        return {
          label: route.meta.title as string,
          key: route.name as string,
          icon: renderIcon(iconComponent || HomeOutline), // 提供默认值
          path: route.path
        };
      })
})

// 菜单选择处理
const handleMenuSelect = (key: string) => {
  router.push({ name: key })
}
</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  border-bottom: 1px solid;
}

.logo-text {
  margin: 0;
  font-weight: bold;
  font-size: 18px;
  transition: all 0.3s;
}
</style>
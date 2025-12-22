<template>
  <n-layout has-sider class="h-screen">
    <!-- 侧边栏 -->
    <Sidebar />

    <n-layout>
      <!-- 顶部导航 -->
      <Header />

      <!-- 主内容区域 -->
      <n-layout-content
          :native-scrollbar="false"
          content-style="padding: 20px; background: #f5f7f9; min-height: calc(100vh - 64px);"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { NLayout, NLayoutContent } from 'naive-ui'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
</script>

<style scoped>
</style>
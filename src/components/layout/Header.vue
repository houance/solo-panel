<template>
  <n-layout-header bordered class="header">
    <div class="header-left">
    </div>

    <div class="header-right">
      <n-space :size="20" align="center">
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button text @click="handleSettings">
              <n-icon size="24">
                <SettingsOutline />
              </n-icon>
            </n-button>
          </template>
          系统设置
        </n-tooltip>

        <n-dropdown :options="userOptions" @select="handleUserSelect">
          <n-avatar round size="medium" :style="{ backgroundColor: '#18a058' }">
            {{ getUserInitials() }}
          </n-avatar>
        </n-dropdown>
      </n-space>
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NLayoutHeader,
  NSpace,
  NButton,
  NIcon,
  NTooltip,
  NDropdown,
  NAvatar,
  type DropdownOption
} from 'naive-ui'
import {
  SettingsOutline,
  PersonCircleOutline,
  ExitOutline
} from '@vicons/ionicons5'
import { renderIcon } from '../../utils/iconRenderer'

// 路由实例
const router = useRouter()

// 用户信息（模拟数据）
const userInfo = ref({
  name: '管理员',
  avatar: ''
})

// 用户下拉菜单选项
const userOptions: DropdownOption[] = [
  {
    label: '个人中心',
    key: 'profile',
    icon: renderIcon(PersonCircleOutline)
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon(ExitOutline)
  }
]

// 获取用户首字母（用于头像显示）
const getUserInitials = () => {
  return userInfo.value.name.charAt(0)
}

// 系统设置点击事件
const handleSettings = () => {
  router.push('/settings')
}

// 用户菜单选择事件
const handleUserSelect = (key: string) => {
  if (key === 'profile') {
    // 跳转到个人中心（这里可以创建新的页面）
    console.log('跳转到个人中心')
  } else if (key === 'logout') {
    // 退出登录逻辑
    console.log('退出登录')
  }
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 64px;
  background: white;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>
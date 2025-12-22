<template>
  <div class="users">
    <n-card title="用户管理">
      <n-space vertical :size="16">
        <n-space>
          <n-input placeholder="搜索用户..." style="width: 300px" />
          <n-button type="primary">添加用户</n-button>
        </n-space>

        <n-data-table
            :columns="columns"
            :data="userList"
            :pagination="pagination"
        />
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import {
  NCard,
  NSpace,
  NInput,
  NButton,
  NDataTable,
  type DataTableColumns,
  NTag
} from 'naive-ui'

// 定义用户数据类型
interface UserData {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  joinDate: string
}

// 用户数据
const userList = ref<UserData[]>([
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', status: 'active', joinDate: '2023-01-15' },
  { id: 2, name: '李四', email: 'lisi@example.com', role: '编辑', status: 'active', joinDate: '2023-02-20' },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: '查看者', status: 'inactive', joinDate: '2023-03-10' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: '编辑', status: 'active', joinDate: '2023-04-05' },
  { id: 5, name: '钱七', email: 'qianqi@example.com', role: '查看者', status: 'active', joinDate: '2023-05-12' }
])

// 表格列定义
const columns: DataTableColumns<UserData> = [
  {
    title: 'ID',
    key: 'id',
    width: 80
  },
  {
    title: '姓名',
    key: 'name'
  },
  {
    title: '邮箱',
    key: 'email'
  },
  {
    title: '角色',
    key: 'role'
  },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(
          NTag,
          {
            type: row.status === 'active' ? 'success' : 'error',
            bordered: false
          },
          {
            default: () => row.status === 'active' ? '活跃' : '未激活'
          }
      )
    }
  },
  {
    title: '加入日期',
    key: 'joinDate'
  },
  {
    title: '操作',
    key: 'actions',
    render() {
      return h('div', [
        h(NButton, { text: true, type: 'primary', size: 'small' }, () => '编辑'),
        h(NButton, { text: true, type: 'error', size: 'small', style: 'margin-left: 8px;' }, () => '删除')
      ])
    }
  }
]

// 分页配置
const pagination = ref({
  pageSize: 10
})
</script>
<template>
  <div class="users">
    <n-card title="任务流管理">
      <n-space vertical :size="16">
        <n-space>
          <n-input placeholder="搜索任务流..." style="width: 300px" />
          <n-button type="primary" @click="handleAddJobFlow">添加任务流</n-button>
        </n-space>

        <n-data-table
            :columns="columns"
            :data="flowInfoDTOList"
            :pagination="pagination"
        />
      </n-space>
    </n-card>

    <!-- 添加 Modal -->
    <CreateJobFlowModal
        v-model:show="showAddModal"
        @success="handleFlowCreated"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, h, onUnmounted, onMounted} from 'vue'
import {
  NCard,
  NSpace,
  NInput,
  NButton,
  NDataTable,
  NSwitch,
  type DataTableColumns
} from 'naive-ui'
import type {FlowInfoDTO} from "../api/jobflow/type.ts";
import {useGlobalTimerStore} from "../store/timer.ts";
import {deleteFlow, disableFlow, enableFlow, getAllFlowInfo} from "../api/jobflow/api.ts";
import CreateJobFlowModal from "../components/jobflow/CreateJobFlowModal.vue";

// 使用定时器
const timer = useGlobalTimerStore();
onMounted(() => {
  timer.registerJob("getFlowInfoFunc", getFlowInfoFunc);
});
onUnmounted(() => {
  timer.unregisterJob("getFlowInfoFunc");
});

// 获取 flowInfoDTO
const getFlowInfoFunc = async () => {
  let tmp:FlowInfoDTO[] = await getAllFlowInfo();
  if (tmp === null || tmp === undefined) {
    tmp = []
  }
  flowInfoDTOList.value = tmp
}
const flowInfoDTOList = ref<FlowInfoDTO[]>([])
// 处理开关状态切换
const loadingFlowId = ref<string | null>(null)
const handleSwitchChange = async (row: FlowInfoDTO, value: boolean) => {
  console.log('切换开关状态:', row.flowDefinitionId, '新状态:', value)
  // 设置当前操作的 flowId 为 loading 状态
  loadingFlowId.value = row.flowDefinitionId
  // 这里可以添加您的业务逻辑，比如调用API更新后端状态
  try {
    if (value) {
      await enableFlow(row)
      row.enabled = 1
    } else {
      await disableFlow(row)
      row.enabled = 0
    }
  } catch (error) {
    console.error('切换状态失败:', error)
    // 错误处理，可以显示提示消息
  } finally {
    // 清除 loading 状态
    loadingFlowId.value = null
  }
}

// 处理编辑操作
const handleEdit = async (row: FlowInfoDTO) => {
  console.log('编辑:', row.flowDefinitionId)
  // 这里可以添加编辑逻辑
  await getFlowInfoFunc();
}

// 处理删除操作
const handleDelete = async (row: FlowInfoDTO) => {
  console.log('删除:', row.flowDefinitionId)
  // 这里可以添加删除逻辑
  await deleteFlow(row).then(getFlowInfoFunc);
}

// 处理添加任务流操作
const showAddModal = ref(false) // 控制添加任务流modal显示
const handleAddJobFlow = () => {
  console.log("添加任务流")
  showAddModal.value = true
}
// 处理任务流添加完成的操作
const handleFlowCreated = (formData: any) => {
  console.log('创建的任务流数据:', formData)
  // 刷新任务流列表
  getFlowInfoFunc()
}

// 状态和颜色映射配置
const statusConfig = {
  SUCCESS: {
    text: '成功',
    type: 'success' as const,
    color: '#18a058'
  },
  FAILED: {
    text: '失败',
    type: 'error' as const,
    color: '#d03050'
  },
  RUNNING: {
    text: '运行中',
    type: 'warning' as const,
    color: '#f0a020'
  },
  PENDING: {
    text: '等待',
    type: 'default' as const,
    color: '#6b7280'
  }
} as const

// 表格列定义
const columns: DataTableColumns<FlowInfoDTO> = [
  {
    title: 'ID',
    key: 'flowDefinitionId',
    width: 80,
    align: 'center' as const
  },
  {
    title: '任务流名称',
    key: 'flowName',
    align: 'center' as const
  },
  {
    title: 'Cron 表达式',
    key: 'cronConfig',
    align: 'center' as const
  },
  {
    title: '上一次执行状态',
    key: 'lastExecutionExecStatus',
    align: 'center' as const,
    render(row) {
      const status = row.lastExecutionExecStatus as keyof typeof statusConfig
      const config = statusConfig[status] || statusConfig.PENDING

      return h(NButton, {
        size: 'small',
        type: config.type,
        color: config.color,
        style: {
          backgroundColor: config.color,
          borderColor: config.color,
          color: 'white',
          minWidth: '70px'
        },
        disabled: true // 禁用点击
      }, {
        default: () => config.text
      })
    }
  },
  {
    title: '上一次执行耗时(秒)',
    key: 'lastExecutionDuration',
    align: 'center' as const
  },
  {
    title: '启用',
    key: 'enabled',
    align: 'center' as const,
    render(row) {
      const isLoading = loadingFlowId.value === row.flowDefinitionId

      return h('div', { style: { display: 'flex', justifyContent: 'center' } }, [
        h(NSwitch, {
          value: row.enabled === 1,
          'onUpdate:value': (value: boolean) => handleSwitchChange(row, value),
          size: 'small',
          loading: isLoading,
          disabled: isLoading // loading 时禁用点击
        })
      ])
    }
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center' as const,
    render(row) {
      return h('div', {
        style: {
          display: 'flex',
          justifyContent: 'center',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          width: 'fit-content',
          margin: '0 auto'
        }
      }, [
        h(NButton, {
          size: 'small',
          type: 'primary',
          style: {
            backgroundColor: '#5cadff',
            borderColor: '#5cadff',
            color: 'white',
            borderRadius: '6px 0 0 6px',
            borderRight: '1px solid rgba(255,255,255,0.3)',
            padding: '0 12px'
          },
          disabled: true,
          onClick: () => handleEdit(row)
        }, () => '编辑'),
        h(NButton, {
          size: 'small',
          type: 'error',
          style: {
            backgroundColor: '#ff7875',
            borderColor: '#ff7875',
            color: 'white',
            borderRadius: '0 6px 6px 0',
            padding: '0 12px'
          },
          onClick: () => handleDelete(row)
        }, () => '删除')
      ])
    }
  }
]

// 分页配置
const pagination = ref({
  pageSize: 15
})
</script>
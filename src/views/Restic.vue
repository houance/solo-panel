<template>
  <div class="snapshot-list-page">
    <n-card title="快照列表" :bordered="false">
      <n-space vertical :size="16">
        <n-space>
          <n-input
              v-model:value="searchText"
              placeholder="搜索源目录、主机名或用户名..."
              style="width: 300px"
          >
            <template #prefix>
              <n-icon><search-outline /></n-icon>
            </template>
          </n-input>
        </n-space>

        <!-- 使用折叠面板替代表格 -->
        <n-collapse
            :default-expanded-names="[]"
            accordion
            display-directive="show"
            class="snapshot-collapse"
        >
          <n-collapse-item
              v-for="group in groupedData"
              :key="group.sourceDirectory"
              :name="group.sourceDirectory"
              :class="'collapse-group'"
          >
            <template #header>
              <div class="collapse-header">
                <div class="header-main">
                  <n-icon size="18" color="#2080f0" style="margin-right: 8px">
                    <folder-outline />
                  </n-icon>
                  <span class="directory-path">{{ group.sourceDirectory }}</span>
                </div>
                <div class="header-stats">
                  <n-space :size="20">
                    <div class="stat-item">
                      <n-icon size="14" style="margin-right: 4px">
                        <time-outline />
                      </n-icon>
                      <span>{{ group.snapshotCount }} 个快照</span>
                    </div>
                    <div class="stat-item">
                      <n-icon size="14" style="margin-right: 4px">
                        <document-text-outline />
                      </n-icon>
                      <span>{{ formatNumber(group.totalFileCount) }} 文件</span>
                    </div>
                    <div class="stat-item">
                      <n-icon size="14" style="margin-right: 4px">
                        <folder-open-outline />
                      </n-icon>
                      <span>{{ formatNumber(group.totalDirCount) }} 目录</span>
                    </div>
                    <div class="stat-item">
                      <n-icon size="14" style="margin-right: 4px">
                        <camera-outline />
                      </n-icon>
                      <span>{{ formatBytes(group.totalSize) }}</span>
                    </div>
                  </n-space>
                </div>
              </div>
            </template>

            <!-- 分组内部的表格 -->
            <n-data-table
                :columns="columns"
                :data="group.snapshots"
                :row-key="(row) => row.snapshotId"
                :bordered="false"
                :striped="true"
                :loading="loading"
                size="small"
                class="inner-table"
            />
          </n-collapse-item>
        </n-collapse>
      </n-space>
    </n-card>
  </div>
  <!-- snapshot file browser modal -->
  <SnapFileBrowserModal
    v-model:show="isModalVisible"
    v-model:snapshotMetaEntity="selectedSnapMeta"
  />
</template>

<script setup lang="ts">
import {ref, computed, h, onMounted, onUnmounted} from 'vue'
import {
  NDataTable,
  NButton,
  NIcon,
  NInput,
  NSpace,
  NCard,
  NCollapse,
  NCollapseItem,
  type DataTableColumns
} from 'naive-ui'
import {
  FolderOutline,
  DocumentTextOutline,
  FolderOpenOutline,
  CameraOutline,
  DesktopOutline,
  PersonOutline,
  EyeOutline,
  TimeOutline,
  ServerOutline,
  SearchOutline
} from '@vicons/ionicons5'
import type {SnapshotMetaEntity, GroupData} from "../api/snapshot/type.ts";
import {useGlobalTimerStore} from "../store/timer.ts";
import {getAllSnapshots} from "../api/snapshot/api.ts";
import SnapFileBrowserModal from "../components/snapshot/SnapFileBrowserModal.vue";

// 响应式数据
const snapshotMetaEntityList = ref<SnapshotMetaEntity[]>([])
const searchText = ref('')
const loading = ref(false)

// 格式化字节数为易读格式
const formatBytes = (bytes: string | number): string => {
  const bytesNum = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  if (bytesNum === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytesNum) / Math.log(k))

  return parseFloat((bytesNum / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化数字，添加千位分隔符
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 格式化时间 (Java Instant.toString() 格式)
const formatTime = (instantStr: string): string => {
  try {
    const date = new Date(instantStr)
    return date.toLocaleString('zh-CN')
  } catch (e) {
    return instantStr
  }
}

// 计算属性：过滤数据
const filteredSnapshotMetaEntity = computed(() => {
  if (!searchText.value.trim()) {
    return snapshotMetaEntityList.value
  }

  const query = searchText.value.toLowerCase()
  return snapshotMetaEntityList.value.filter(snapshot =>
      snapshot.sourceDirectory.toLowerCase().includes(query) ||
      snapshot.hostname.toLowerCase().includes(query) ||
      snapshot.username.toLowerCase().includes(query) ||
      snapshot.backupRepository.toLowerCase().includes(query)
  )
})

// 计算属性：分组数据
const groupedData = computed(() => {
  const groups: Record<string, GroupData> = {}

  // 按源目录分组并计算统计信息
  filteredSnapshotMetaEntity.value.forEach(snapshot => {
    const key = snapshot.sourceDirectory

    if (!groups[key]) {
      groups[key] = {
        sourceDirectory: key,
        snapshotCount: 0,
        totalFileCount: 0,
        totalDirCount: 0,
        totalSize: 0,
        snapshots: []
      }
    }

    // 更新统计信息
    const sizeNum = parseInt(snapshot.snapshotSizeBytes, 10)
    groups[key].snapshotCount++
    groups[key].totalFileCount += parseInt(snapshot.fileCount, 10)
    groups[key].totalDirCount += parseInt(snapshot.dirCount, 10)
    groups[key].totalSize += sizeNum
    groups[key].snapshots.push(snapshot)
  })

  // 转换为数组并按快照数量降序排序
  return Object.values(groups).sort((a, b) => b.snapshotCount - a.snapshotCount)
})

// 表格列定义（用于分组内部的表格）
const columns: DataTableColumns<SnapshotMetaEntity> = [
  {
    title: () => h('div', { class: 'column-title' }, [
      h(NIcon, { size: 14, style: 'margin-right: 4px' }, {
        default: () => h(TimeOutline)
      }),
      '备份时间'
    ]),
    key: 'backupTime',
    width: 160,
    render: (row) => {
      return h('div', { style: 'font-size: 14px;' }, formatTime(row.createdAt))
    }
  },
  {
    title: () => h('div', { class: 'column-title' }, [
      h(NIcon, { size: 14, style: 'margin-right: 4px' }, {
        default: () => h(ServerOutline)
      }),
      '备份仓库'
    ]),
    key: 'backupRepository',
    width: 200,
    ellipsis: true,
    render: (row) => {
      return h('div', {
        style: 'font-size: 14px;',
        title: row.backupRepository
      }, row.backupRepository)
    }
  },
  {
    title: '文件信息',
    key: 'fileInfo',
    width: 160,
    render: (row) => {
      return h('div', { class: 'file-stats-container' }, [
        h('div', { class: 'stat-cell' }, [
          h(NIcon, {
            size: 14,
            color: '#666',
            style: 'margin-right: 4px; vertical-align: middle;'
          }, {
            default: () => h(DocumentTextOutline)
          }),
          h('span', { style: 'color: #333; vertical-align: middle;' }, `${row.fileCount}`)
        ]),

        h('div', { class: 'stat-cell' }, [
          h(NIcon, {
            size: 14,
            color: '#666',
            style: 'margin-right: 4px; vertical-align: middle;'
          }, {
            default: () => h(FolderOpenOutline)
          }),
          h('span', { style: 'color: #333; vertical-align: middle;' }, `${row.dirCount}`)
        ]),

        h('div', { class: 'stat-cell' }, [
          h(NIcon, {
            size: 14,
            color: '#666',
            style: 'margin-right: 4px; vertical-align: middle;'
          }, {
            default: () => h(CameraOutline)
          }),
          h('span', { style: 'color: #333; vertical-align: middle;' }, formatBytes(row.snapshotSizeBytes))
        ])
      ])
    }
  },
  {
    title: '主机信息',
    key: 'hostInfo',
    width: 180,
    render: (row) => {
      return h('div', { class: 'host-info-container' }, [
        h('div', { class: 'host-cell' }, [
          h(NIcon, {
            size: 14,
            color: '#18a058',
            style: 'margin-right: 6px; vertical-align: middle;'
          }, {
            default: () => h(DesktopOutline)
          }),
          h('span', { style: 'color: #333; vertical-align: middle;' }, row.hostname)
        ]),

        h('div', { class: 'host-cell' }, [
          h(NIcon, {
            size: 14,
            color: '#d03050',
            style: 'margin-right: 6px; vertical-align: middle;'
          }, {
            default: () => h(PersonOutline)
          }),
          h('span', { style: 'color: #333; vertical-align: middle;' }, row.username)
        ])
      ])
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    fixed: 'right',
    render: (row) => {
      return h(
          NButton,
          {
            size: 'tiny',
            type: 'primary',
            ghost: true,
            onClick: () => handleBrowseFiles(row),
            style: 'font-weight: 500; vertical-align: middle;'
          },
          {
            default: () => h('div', { class: 'action-button' }, [
              h(NIcon, { size: 14, style: 'margin-right: 4px; vertical-align: middle;' }, {
                default: () => h(EyeOutline)
              }),
              '浏览'
            ])
          }
      )
    }
  }
]

// snapshot file browser
const isModalVisible = ref<boolean>(false)
const selectedSnapMeta = ref<SnapshotMetaEntity>();
const handleBrowseFiles = (snapshotMetaEntity: SnapshotMetaEntity) => {
  // 打开 browser modal
  isModalVisible.value = true;
  selectedSnapMeta.value = snapshotMetaEntity;
}

// 使用定时器
const timer = useGlobalTimerStore();
onMounted(() => {
  timer.registerJob("getAllSnapshotsFunc", loadData);
});
onUnmounted(() => {
  timer.unregisterJob("getAllSnapshotsFunc");
});

// 获取snapshot data的方法
const loadData = async () => {
  loading.value = true
  // 获取数据
  let tmp: SnapshotMetaEntity[] = await getAllSnapshots()
  if (tmp === null || tmp === undefined) {
    tmp = []
  }
  snapshotMetaEntityList.value = tmp;
  loading.value = false
}
</script>

<style scoped>
.snapshot-list-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 16px;
}

.header-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0; /* 允许文本溢出 */
}

.directory-path {
  font-weight: 600;
  font-size: 14px;
  color: #2080f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.header-stats {
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 折叠面板样式 - 解决间距问题 */
.snapshot-collapse {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 文件信息列样式 - 解决图标对齐问题 */
.file-stats-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-cell {
  display: flex;
  align-items: center;
  white-space: nowrap;
  line-height: 1;
}

/* 主机信息列样式 - 解决图标对齐问题 */
.host-info-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.host-cell {
  display: flex;
  align-items: center;
  white-space: nowrap;
  line-height: 1;
}

/* 内部表格样式 */
.inner-table {
  border-top: 1px solid #e8eaec;
}

.column-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  line-height: 1;
}

/* 折叠面板样式 */
:deep(.snapshot-collapse .n-collapse-item) {
  margin-bottom: 1px !important; /* 只保留1px的间距，而不是默认的较大间距 */
}

:deep(.snapshot-collapse .n-collapse-item__header) {
  background-color: #f0f7ff !important;
  border-bottom: 1px solid #d4e3ff;
  padding: 12px 16px !important;
  transition: background-color 0.2s ease;
}

:deep(.snapshot-collapse .n-collapse-item__header:hover) {
  background-color: #e6f2ff !important;
}

:deep(.snapshot-collapse .n-collapse-item__header-main) {
  padding: 0 !important;
}

:deep(.snapshot-collapse .n-collapse-item__content-inner) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

:deep(.snapshot-collapse .n-collapse-item:not(:last-child)) {
  border-bottom: 1px solid #e8eaec;
}

/* 内部表格样式 */
:deep(.inner-table .n-data-table) {
  margin: 0 !important;
}

:deep(.inner-table .n-data-table-th) {
  background-color: #f8f9fa;
  font-weight: 500;
  color: #555;
  font-size: 14px;
  height: 36px;
  padding: 8px 16px !important;
}

:deep(.inner-table .n-data-table-td) {
  padding: 8px 16px !important;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  height: 40px;
}

:deep(.inner-table .n-data-table-tr--hover) {
  background-color: #f8f9fa !important;
}

:deep(.inner-table .n-data-table-td .n-button) {
  height: 24px;
  line-height: 24px;
}

:deep(.inner-table .n-data-table-td .n-button__content) {
  height: 24px;
  line-height: 24px;
}
</style>
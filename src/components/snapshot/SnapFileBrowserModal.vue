<template>
  <n-modal
      v-model:show="internalShow"
      :mask-closable="false"
      preset="dialog"
      :show-icon="false"
      style="width: 1300px;"
      @close="handleClose"
  >
    <!-- 文件浏览器主体 -->
    <div class="file-browser-container">
      <!-- 路径导航 -->
      <div class="path-nav">
        <n-breadcrumb>
          <n-breadcrumb-item>
            <n-button text size="small" @click="goToRoot">
              <n-icon size="16">
                <HomeOutline />
              </n-icon>
            </n-button>
          </n-breadcrumb-item>
          <n-breadcrumb-item v-for="(path, index) in breadcrumbs" :key="index">
            <n-button text size="small" @click="navigateTo(index)">
              {{ path }}
            </n-button>
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>

      <!-- 文件列表 -->
      <div class="file-list">
        <n-data-table
            :data="sortedFileList"
            :columns="columns"
            :loading="loading"
            :row-key="(row: SnapshotItemDTO) => row.path"
            :bordered="false"
            size="small"
            class="file-table"
        />
      </div>
    </div>

    <!-- 文件预览模态框 -->
    <n-modal
        v-model:show="previewVisible"
        preset="dialog"
        style="width: 80%;"
        @close="previewVisible = false"
    >
      <div class="preview-content">
        <!-- 图片预览 -->
        <img
            v-if="previewFileType === 'image' && previewUrl"
            :src="previewUrl"
            class="preview-image"
        />

        <!-- TXT 预览 -->
        <iframe
            v-else-if="previewFileType === 'text' && previewUrl"
            :src="previewUrl"
            class="preview-text"
        />

        <!-- PDF 预览 -->
        <iframe
            v-else-if="previewFileType === 'pdf' && previewUrl"
            :src="previewUrl"
            class="preview-pdf"
        />

        <!-- 其他类型 -->
        <div v-else class="unsupported-preview">
          <n-icon size="64" color="#999">
            <Document />
          </n-icon>
          <p>不支持预览此文件类型</p>
        </div>
      </div>
    </n-modal>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, h, computed, watch, nextTick } from 'vue'
import {
  NModal,
  NDataTable,
  NButton,
  NIcon,
  NSpace,
  NBreadcrumb,
  NBreadcrumbItem,
  useMessage
} from 'naive-ui'
import {
  Folder,
  DocumentText,
  HomeOutline
} from '@vicons/ionicons5'
import type { SnapshotItemDTO } from "../../api/snapshot/type.ts";
import {getDownloadResult, getSnapshotItems, submitDownloadJob} from "../../api/snapshot/api.ts";
import {it} from "node:test";

const props = defineProps<{
  show: boolean;
  snapshotMetaEntity: any;
}>()

// 内部状态
const loading = ref<boolean>(false)
const fileList = ref<SnapshotItemDTO[]>([])
const previewVisible = ref<boolean>(false)
const previewFileType = ref<'image' | 'text' | 'pdf' | 'other' | null>(null)
const previewUrl = ref<string>('')
const previewTitle = ref<string>('文件预览')
const currentPath = ref<string>('/')
const breadcrumbs = ref<string[]>([])
const message = useMessage()

// 内部显示状态
const internalShow = computed({
  get: () => props.show,
  set: (value) => {
    emit('update:show', value)
  }
})

// 定义事件
const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

// 计算属性
const sortedFileList = computed(() => {
  return [...fileList.value].sort((a, b) => {
    if (a.type === 'dir' && b.type === 'file') return -1
    if (a.type === 'file' && b.type === 'dir') return 1
    return a.name.localeCompare(b.name)
  })
})

// 监听 show 属性的变化
watch(() => props.show, async (newVal) => {
  if (newVal) {
    await nextTick()
    await fetchFiles()
  } else {
    fileList.value = []
    breadcrumbs.value = []
    currentPath.value = '/'
  }
})

// 获取文件列表
const fetchFiles = async () => {
  try {
    loading.value = true
    let tmp: SnapshotItemDTO[] = await getSnapshotItems(
        props.snapshotMetaEntity,
        currentPath.value
    )
    if (tmp === null || tmp === undefined) {
      tmp = []
    }
    fileList.value = tmp
  } catch (error) {
    console.error('获取文件列表失败:', error)
    message.error('获取文件列表失败')
  } finally {
    loading.value = false
  }
}

// 字节转易读格式
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间
const formatTime = (instantStr: string): string => {
  try {
    const date = new Date(instantStr)
    return date.toLocaleDateString('zh-CN')
  } catch (e) {
    return instantStr
  }
}

// 打开目录
const openDirectory = async (dirName: string) => {
  currentPath.value = currentPath.value === '/' ? `/${dirName}/` : `${currentPath.value}${dirName}/`
  breadcrumbs.value = currentPath.value.split('/').filter((part) => part)
  await fetchFiles()
}

// 返回根目录
const goToRoot = async () => {
  currentPath.value = '/'
  breadcrumbs.value = []
  await fetchFiles()
}

// 导航到面包屑中的路径
const navigateTo = async (index: number) => {
  if (index === breadcrumbs.value.length - 1) return
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  currentPath.value = '/' + breadcrumbs.value.join('/') + (breadcrumbs.value.length > 0 ? '/' : '')
  await fetchFiles()
}

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
}

// 预览文件
const previewFileFunc = async (item: SnapshotItemDTO) => {
  previewVisible.value = true
  previewTitle.value = `预览: ${item.name}`

  const ext = getFileExtension(item.name)

  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    previewFileType.value = 'image'
    previewUrl.value = `https://picsum.photos/800/600?random=${Math.random()}`
  } else if (['txt'].includes(ext)) {
    previewFileType.value = 'text'
    const textContent = `文件名称: ${item.name}\n文件大小: ${formatSize(item.size)}\n修改时间: ${formatTime(item.ctime)}`
    previewUrl.value = URL.createObjectURL(new Blob([textContent], { type: 'text/plain' }))
  } else if (ext === 'pdf') {
    previewFileType.value = 'pdf'
    previewUrl.value = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  } else {
    previewFileType.value = 'other'
  }
}

// 下载文件
const downloadFile = async (item: SnapshotItemDTO, isPreview: boolean) => {
  loading.value = true

  try {
    const jobId = await submitDownloadJob({
      snapshotMetaEntity: props.snapshotMetaEntity,
      snapshotItemDTOList: [item]
    });
    const downloadResult = await getDownloadResult(jobId, isPreview);
    if (downloadResult === undefined || downloadResult.status >= 400) {
      message.error("文件下载失败. 消息是 " + downloadResult.data)
      loading.value = false
      return;
    } else if (downloadResult.status === 202) {
      // 循环5此, 间隔3分钟
    }

    const content = `文件: ${item.name}\n大小: ${formatSize(item.size)}\n时间: ${formatTime(item.ctime)}`
    const blob = new Blob([content], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    message.success('下载任务已开始')
  } catch (e) {
    message.error('文件下载失败')
  } finally {
    loading.value = false
  }
}

const downloadFileTmp = async (item: SnapshotItemDTO) => {
  loading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const content = `文件: ${item.name}\n大小: ${formatSize(item.size)}\n时间: ${formatTime(item.ctime)}`
    const blob = new Blob([content], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    message.success('下载任务已开始')
  } catch (e) {
    console.error('文件下载失败:', e)
    message.error('文件下载失败')
  } finally {
    loading.value = false
  }
}

// 处理关闭
const handleClose = () => {
  internalShow.value = false
  currentPath.value = '/'
  breadcrumbs.value = []
  fileList.value = []
}

// 表格列定义
const columns = [
  {
    title: '名称',
    key: 'name',
    render: (row: SnapshotItemDTO) => {
      const icon = row.type === 'file'
          ? h(NIcon, { component: DocumentText, style: 'margin-right: 8px;' })
          : h(NIcon, { component: Folder, style: 'margin-right: 8px;' })

      const content = row.type === 'dir'
          ? h(NButton, {
            text: true,
            onClick: () => openDirectory(row.name)
          }, { default: () => row.name })
          : row.name

      return h('div', {
        style: 'display: flex; align-items: center;'
      }, [icon, content])
    }
  },
  {
    title: '大小',
    key: 'size',
    width: 120,
    render: (row: SnapshotItemDTO) => formatSize(row.size)
  },
  {
    title: '修改日期',
    key: 'modified',
    width: 150,
    render: (row: SnapshotItemDTO) => formatTime(row.ctime)
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row: SnapshotItemDTO) => {
      return h(NSpace, { size: 'small' }, [
        row.type === 'file' && h(NButton, {
          size: 'small',
          onClick: () => previewFileFunc(row)
        }, '预览'),
        h(NButton, {
          size: 'small',
          type: 'primary',
          onClick: () => downloadFile(row)
        }, '下载')
      ].filter(Boolean))
    }
  }
]
</script>

<style scoped>
/* 文件浏览器容器 */
.file-browser-container {
  display: flex;
  flex-direction: column;
  height: 70vh;
}

/* 路径导航 */
.path-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid #eee;
}

/* 文件列表 */
.file-list {
  flex: 1;
  overflow: hidden;
}

.file-table {
  height: 100%;
}

/* 预览内容 */
.preview-content {
  height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.preview-text,
.preview-pdf {
  width: 100%;
  height: 100%;
  border: none;
}

.unsupported-preview {
  text-align: center;
  padding: 40px;
}

.unsupported-preview p {
  margin-top: 16px;
  color: #666;
}

/* 简单表格样式 */
:deep(.n-data-table .n-data-table-th) {
  background: #fafafa !important;
  border-bottom: 1px solid #e0e0e0 !important;
}

:deep(.n-data-table .n-data-table-td) {
  border-bottom: 1px solid #f0f0f0 !important;
}

:deep(.n-data-table-tr:hover) {
  background: #f5f5f5 !important;
}
</style>
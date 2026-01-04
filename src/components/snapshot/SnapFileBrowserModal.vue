<template>
  <n-modal
      v-model:show="isModalVisible"
      :title="'Snapshots History'"
      :mask-closable="false"
      preset="dialog"
      style="width: 1300px;"
      @close="isModalVisible = false"
  >
    <n-layout class="file-browser-container">
      <!-- 标题 -->
      <n-layout-header class="header" bordered>
        <h1>文件浏览器</h1>
      </n-layout-header>

      <n-layout-content class="content">
        <!-- 面包屑导航 -->
        <n-breadcrumb class="breadcrumb">
          <n-breadcrumb-item>
            <n-button text @click="goToRoot">根目录</n-button>
          </n-breadcrumb-item>
          <n-breadcrumb-item v-for="(path, index) in breadcrumbs" :key="index">
            <n-button text @click="navigateTo(index)">{{ path }}</n-button>
          </n-breadcrumb-item>
        </n-breadcrumb>

        <!-- 文件列表表格 -->
        <n-data-table
            :data="fileList"
            :columns="columns"
            :loading="loading"
            :row-key="(row: SnapshotFileInfo) => row.name"
            class="file-table"
        />

        <!-- 文件预览模态框 -->
        <n-modal
            v-model:show="previewVisible"
            :title="previewTitle"
            preset="dialog"
            style="width: 80%;"
            :show-icon="false"
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
              <n-icon size="64" color="#1890ff">
                <Document />
              </n-icon>
              <p>不支持预览此文件类型</p>
            </div>
          </div>
        </n-modal>
      </n-layout-content>
    </n-layout>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import {
  NModal,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NBreadcrumb,
  NBreadcrumbItem,
  NDataTable,
  NButton,
  NIcon,
  NSpace,
  useMessage
} from 'naive-ui'
import { Document, Folder, DocumentText } from '@vicons/ionicons5'

interface SnapshotFileInfo {
  name: string
  fileName: string
  size: number
  lastModifiedTime: string
  type: 'file' | 'dir'
}

// modal 是否打开的变量
const isModalVisible = ref<boolean>(false)
// modal 传入的 snapshotId
const backupJobId = ref<string>('')
// 文件列表
const fileList = ref<SnapshotFileInfo[]>([])
// 文件列表加载状态
const loading = ref<boolean>(true)
// 文件预览模态框可见性
const previewVisible = ref<boolean>(false)
// 预览的文件类型
const previewFileType = ref<'image' | 'text' | 'pdf' | 'other' | null>(null)
// 预览的文件URL
const previewUrl = ref<string>('')
// 预览的标题
const previewTitle = ref<string>('文件预览')
// 消息提示
const message = useMessage()

// 模拟数据 - 文件列表
const mockFileList: SnapshotFileInfo[] = [
  { name: 'documents', fileName: 'documents', size: 2.5, lastModifiedTime: '2023-10-15 14:30:00', type: 'dir' },
  { name: 'images', fileName: 'images', size: 5.8, lastModifiedTime: '2023-10-16 09:15:00', type: 'dir' },
  { name: 'report.pdf', fileName: 'report.pdf', size: 1.2, lastModifiedTime: '2023-10-17 16:45:00', type: 'file' },
  { name: 'notes.txt', fileName: 'notes.txt', size: 0.1, lastModifiedTime: '2023-10-18 11:20:00', type: 'file' },
  { name: 'photo.jpg', fileName: 'photo.jpg', size: 3.5, lastModifiedTime: '2023-10-19 13:10:00', type: 'file' },
  { name: 'data.json', fileName: 'data.json', size: 0.5, lastModifiedTime: '2023-10-20 10:05:00', type: 'file' },
]

// 面包屑当前路径
const currentPath = ref<string>('/')
// 面包屑值, 面包屑导航中不包括根路径
const breadcrumbs = ref<string[]>([])

// 获取文件列表
const fetchFiles = async () => {
  try {
    loading.value = true
    if (!backupJobId || backupJobId.value === '') {
      console.error('backupJobId must be specified!')
      return
    }
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    // 使用模拟数据
    fileList.value = mockFileList.map(item => ({
      ...item,
      // 模拟根据路径过滤
      name: currentPath.value === '/' ? item.name : `${currentPath.value}${item.name}`
    }))
  } catch (error) {
    console.error('获取文件列表失败:', error)
    message.error('获取文件列表失败')
  } finally {
    loading.value = false
  }
}

// 打开目录
const openDirectory = async (dirName: string) => {
  // 当前路径拼接目标文件夹
  currentPath.value = `${currentPath.value}${dirName}/`
  // 从当前路径中提取面包屑部分（排除首尾的斜杠）, 并更新
  breadcrumbs.value = currentPath.value.split('/').filter((part) => part)
  // 刷新文件列表
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
  // 点击当前路径,不跳转
  if (index === breadcrumbs.value.length - 1) return
  // 新面包屑 = 旧的面包屑截取 0~index 的元素
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  // 新路径 = 根路径('/') 拼接面包屑中的路径(使用'/'拼接)
  currentPath.value = '/' + breadcrumbs.value.join('/')
  await fetchFiles()
}

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
}

// 预览文件
const previewFileFunc = async (snapshotFileInfo: SnapshotFileInfo) => {
  previewVisible.value = true
  previewTitle.value = `预览: ${snapshotFileInfo.fileName}`

  // 根据文件扩展名确定文件类型
  const ext = getFileExtension(snapshotFileInfo.fileName)

  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    previewFileType.value = 'image'
    // 使用模拟图片URL
    previewUrl.value = `https://picsum.photos/800/600?random=${Math.random()}`
  } else if (['txt'].includes(ext)) {
    previewFileType.value = 'text'
    // 创建文本Blob URL
    const textContent = '这是模拟的文本文件内容。\n\n' +
        '文件名: ' + snapshotFileInfo.fileName + '\n' +
        '大小: ' + snapshotFileInfo.size + ' MB\n' +
        '修改时间: ' + snapshotFileInfo.lastModifiedTime + '\n\n' +
        '这是一段模拟的文本内容，用于演示文件预览功能。\n' +
        '实际应用中会显示真实的文件内容。'
    previewUrl.value = URL.createObjectURL(new Blob([textContent], { type: 'text/plain' }))
  } else if ('pdf' === ext) {
    previewFileType.value = 'pdf'
    // 使用示例PDF
    previewUrl.value = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  } else {
    previewFileType.value = 'other'
  }
}

// 下载文件
const downloadFile = async (snapshotFileInfo: SnapshotFileInfo) => {
  loading.value = true

  try {
    // 模拟下载延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 创建模拟的Blob数据
    const content = `模拟下载的文件: ${snapshotFileInfo.fileName}\n大小: ${snapshotFileInfo.size}MB\n时间: ${snapshotFileInfo.lastModifiedTime}`
    const blob = new Blob([content], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = snapshotFileInfo.fileName
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

// 表格列定义
const createColumns = () => {
  return [
    {
      title: '名称',
      key: 'name',
      width: '45%',
      render: (row: SnapshotFileInfo) => {
        const icon = row.type === 'file'
            ? h(NIcon, { component: DocumentText, color: '#1890ff' })
            : h(NIcon, { component: Folder, color: '#faad14' })

        const content = row.type === 'dir'
            ? h(NButton, {
              text: true,
              onClick: () => openDirectory(row.fileName)
            }, { default: () => row.fileName })
            : row.fileName

        return h('div', { class: 'file-name-cell' }, [
          icon,
          h('span', { style: 'margin-left: 8px;' }, content)
        ])
      }
    },
    {
      title: '大小',
      key: 'size',
      width: '15%',
      render: (row: SnapshotFileInfo) => `${row.size} MB`
    },
    {
      title: '修改日期',
      key: 'modified',
      width: '25%',
      render: (row: SnapshotFileInfo) => row.lastModifiedTime
    },
    {
      title: '操作',
      key: 'actions',
      width: '15%',
      render: (row: SnapshotFileInfo) => {
        return h(NSpace, {}, [
          row.type === 'file' && h(NButton, {
            type: 'primary',
            size: 'small',
            onClick: () => previewFileFunc(row)
          }, { default: () => '预览' }),
          h(NButton, {
            type: 'primary',
            size: 'small',
            onClick: () => downloadFile(row)
          }, { default: () => '下载' })
        ])
      }
    }
  ]
}

const columns = createColumns()

// 定义需要暴露的方法
defineExpose({
  // 控制 modal 显示隐藏的方法
  showModal: async (backupJobIdArg: string) => {
    isModalVisible.value = true
    // 设置 backupJobId 并刷新文件列表
    backupJobId.value = backupJobIdArg
    await fetchFiles()
  }
})
</script>

<style scoped>
.file-browser-container {
  height: 70vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.header {
  background-color: #1890ff;
  color: white;
  text-align: center;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 60px;
}

.header h1 {
  color: white;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
}

.content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.breadcrumb {
  margin-bottom: 20px;
  padding: 10px 15px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  flex-shrink: 0;
}

.file-table {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  flex: 1;
  overflow: auto;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-content {
  height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.preview-image {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.preview-text {
  width: 100%;
  height: 100%;
  font-family: monospace;
  border: none;
}

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
</style>
<template>
  <div v-if="selectorLoaded" >
    <div class="step-1">
      <h3 style="text-align: center; margin-bottom: 24px">第一步：基本信息</h3>
      <n-form :model="dynamicForm" >
        <n-form-item
            v-for="(item, index) in dynamicForm"
            :key="index"
            :label="`节点${index + 1}(nodeId: ${item.nodeId})`"
            path="name"
        >
          <n-select
              v-model:value="item.name"
              clearable
              filterable
              placeholder="请选择节点"
              :options="selectorOptions"
              @update-value="handleInputChange"
          />
          <n-select
              multiple
              v-model:value="item.nextNodeIds"
              :options="nextNodeIdsOptions(index)"
              @update-value="handleInputChange"
              style="margin-left: 12px"
          />
          <n-button style="margin-left: 12px" @click="removeItem(index)">
            删除
          </n-button>
        </n-form-item>

        <n-form-item>
          <n-space>
            <n-button attr-type="button" @click="addItem">
              增加
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </div>
  </div>
  <div v-else style="display: flex; justify-content: center; align-items: center; height: 300px;">
    <n-spin size="large" />
  </div>
</template>

<script setup lang="ts">
import {ref, defineProps, defineEmits, onMounted} from 'vue'
import {NForm, type SelectOption, type SelectGroupOption} from 'naive-ui'
import type {FlowFormData, Node} from "../../api/jobflow/type.ts";
import {getAllNodes, validNodes} from "../../api/jobflow/api.ts";


const props = defineProps<{
  formData: FlowFormData['step1']
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:form-data', data: Partial<FlowFormData>): void
  (e: 'validate', isValid: boolean): void
}>()
// 选择器数据
const selectorLoaded = ref(false)
const selectorOptions:Array<SelectOption | SelectGroupOption> = []
const getSelectorOptions = async () => {
  const nodes:Node[] = await getAllNodes();
  if (nodes?.length === 0) {
    selectorLoaded.value = true
    return;
  }
  // 创建 look up 表
  const groupedNodes = nodes.reduce((map, element) => {
    const key = element.group;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(element);
    return map;
  }, new Map<string, Node[]>());
  // 遍历 lookup 表, 创建 selectorOptions
  groupedNodes.forEach((nodes, group) => {
    const children:SelectOption[] = nodes.map(value => {
      return {
        label: value.name,
        value: value.name,
      }
    });
    selectorOptions.push({
      type: 'group',
      label: group,
      key: group,
      children: children
    })
  })
  selectorLoaded.value = true
}
onMounted(async () => {
  // 获取节点选择器数据
  await getSelectorOptions();
  // 针对"上一步"的操作, 复制数据
  if (props.formData.nodeList && props.formData.nodeList.length > 0) {
    dynamicForm.value = props.formData.nodeList.slice();
  }
})
// 动态表单数据
const dynamicForm = ref<FlowFormData['step1']['nodeList']>([])
const removeItem = (index: number) => {
  dynamicForm.value.splice(index, 1)
}
const addItem = () => {
  // 获取所有已使用的 nodeId
  const usedNodeIds:string[] = dynamicForm.value.map(node => node.nodeId);
  for (let i = 1; i <= 100; i++) {
    if (!usedNodeIds.includes(i.toString())) {
      dynamicForm.value.push({
        nodeId: i.toString(),
        name: '',
        nextNodeIds: []
      })
      return;
    }
  }
}
// nextNodeIds 树形选择器数据
const nextNodeIdsOptions = (currentIndex: number) => {
  return dynamicForm.value
      .filter((_, index) => index !== currentIndex) // 排除当前节点
      .map(item => ({
        label: `节点${item.nodeId}${item.name ? ` (${item.name})` : ''}`, // 显示节点ID和名称
        value: item.nodeId,
        disabled: !item.name // 如果节点名称未选择，禁用该选项
      }))
}

// 输入变化处理
const handleInputChange = () => {
  emit('update:form-data', { step1: {nodeList: dynamicForm.value} })
}

// 验证方法（暴露给父组件调用）
const validate = async (): Promise<boolean> => {
  try {
    // 这里可以调用真正的 API
    await validNodes(dynamicForm.value);
  } catch (errors) {
    throw errors
  }
  return true
}

// 暴露方法给父组件
defineExpose({
  validate
})
</script>

<style scoped>
.step-1 {
  padding: 8px;
}
</style>
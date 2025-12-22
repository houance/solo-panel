<template>
  <div class="step-2">
    <h3 style="text-align: center; margin-bottom: 24px">第二步：参数配置</h3>
    <n-alert
        v-if="fieldSchemaDTOList.length === 0"
        title="无需配置参数"
        type="info"
        style="margin-bottom: 24px"
    >
      当前任务流的所有节点参数已由前置节点提供。
    </n-alert>

    <n-form ref="formRef" :model="fieldSchemaDTOList">
      <div
          v-for="(fieldSchemaDTO, nodeIndex) in fieldSchemaDTOList"
          :key="nodeIndex"
          class="node-section"
      >
        <div class="node-header">
          <n-text strong style="font-size: 16px">节点 {{ fieldSchemaDTO.nodeId }}</n-text>
        </div>

        <div class="fields-container">
          <n-form-item
              v-for="[fieldName, fieldSchema] in Object.entries(fieldSchemaDTO.fieldSchemaMap)"
              :key="fieldName"
              class="field-item"
          >
            <!-- 一行的布局 -->
            <n-flex align="center" justify="start" :wrap="false" style="width: 100%">
              <!-- 左侧：字段标签和类型 -->
              <n-flex align="center" :wrap="false" class="field-label-group">
                <n-tag size="small" type="info" round style="margin-left: 8px">
                  {{ getTypeDisplay(fieldSchema.typeReference) }}
                </n-tag>
                <n-tooltip trigger="hover" placement="top-start">
                  <template #trigger>
                    <n-text strong>{{ fieldName }}</n-text>
                  </template>
                  {{ fieldSchema.description }}
                </n-tooltip>
                <n-text
                    v-if="fieldSchema.sourceType === 'NODE_OUTPUT'"
                    type="success"
                    size="small"
                    style="margin-left: 8px"
                >
                  (自动获取)
                </n-text>
              </n-flex>

              <!-- 右侧：字段输入控件 -->
              <div class="field-control-wrapper">
                <component
                    :is="getComponentForType(fieldSchema.typeReference)"
                    v-model:value="fieldSchema.value"
                    @update:value="handleFieldUpdate"
                    :placeholder="`请输入 ${fieldName}`"
                    :disabled="fieldSchema.sourceType === 'NODE_OUTPUT'"
                    style="min-width: 300px"
                />
              </div>
            </n-flex>
          </n-form-item>
        </div>

        <!-- 节点分隔线（最后一个节点除外） -->
        <n-divider
            v-if="nodeIndex < fieldSchemaDTOList.length - 1"
            style="margin: 24px 0"
        />
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import {defineEmits, defineProps, onMounted, ref} from 'vue'
import {NAlert, NDatePicker, NForm, NInput, NInputNumber, NSwitch,} from 'naive-ui'
import type {FlowFormData} from "../../api/jobflow/type.ts"
import {getFieldSchema, validFieldSchema} from "../../api/jobflow/api.ts";

const props = defineProps<{
  formData: FlowFormData
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:form-data', data: Partial<FlowFormData>): void
  (e: 'validate', isValid: boolean): void
}>()

// 获取 fieldSchemaDTOList
const fieldSchemaDTOList = ref<FlowFormData['step2']['fieldSchemaDTOList']>([])
onMounted(async () => {
  // 如果已经有数据，就不重新初始化
  if (props.formData.step2 && props.formData.step2.fieldSchemaDTOList.length > 0) {
    fieldSchemaDTOList.value = [ ...props.formData.step2.fieldSchemaDTOList.slice() ]
    return
  }
  const responseData = await getFieldSchema(props.formData.step1.nodeList);
  if (!responseData || responseData.length === 0) {
    return
  } else {
    fieldSchemaDTOList.value = responseData;
  }
  // 初始化后通知父组件
  emit('update:form-data', { step2: { fieldSchemaDTOList: fieldSchemaDTOList.value }})
})
// 获取类型显示文本
const getTypeDisplay = (typeReference: string): string => {
  if (!typeReference) return '未知类型'
  const parts = typeReference.split('.')
  return parts[parts.length - 1] || typeReference
}
// 根据类型返回对应的组件
const getComponentForType = (typeReference: string) => {
  const typeStr = typeReference.toLowerCase()

  switch (true) {
    case typeStr.includes('string'):
      return NInput
    case typeStr.includes('int'):
    case typeStr.includes('integer'):
    case typeStr.includes('long'):
    case typeStr.includes('double'):
    case typeStr.includes('float'):
    case typeStr.includes('number'):
      return NInputNumber
    case typeStr.includes('boolean'):
      return NSwitch
    case typeStr.includes('date'):
      return NDatePicker
    default:
      return NInput
  }
}

// 更新字段值
const handleFieldUpdate = () => {
  emit('update:form-data', { step2: {fieldSchemaDTOList: fieldSchemaDTOList.value }})
}

// 验证方法
const validate = async (): Promise<boolean> => {
  let hasErrors = false
  const emptyFields: string[] = []
  try {
    for (let fieldSchemaDTO of fieldSchemaDTOList.value) {
      for (const [fieldName, fieldSchema] of Object.entries(fieldSchemaDTO.fieldSchemaMap)) {
        if (fieldSchema.sourceType === 'NODE_OUTPUT') {
          continue
        }
        if (fieldSchema.value === null || fieldSchema.value === undefined || fieldSchema.value === '') {
          hasErrors = true
          emptyFields.push(`节点${fieldSchemaDTO.nodeId}的${fieldName}`)
        }
      }
    }
    await validFieldSchema(fieldSchemaDTOList.value)
  } catch (error) {
    throw error;
  }
  if (hasErrors) {
    throw new Error('以下参数未填写:' + emptyFields)
  }
  return true
}

defineExpose({
  validate
})
</script>

<style scoped>
.step-2 {
  max-height: 100%;
  overflow-y: auto;
  padding: 0 8px;
}

.node-section {
  margin-bottom: 32px;
}

.field-item {
  margin-bottom: 12px;
}

.field-item:last-child {
  margin-bottom: 0;
}

.field-label-group {
  min-width: 200px;
}

.field-control-wrapper {
  flex: 1;
  min-width: 300px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .field-label-group {
    min-width: 150px;
  }

  .field-control-wrapper {
    min-width: 200px;
  }

  .fields-container {
    padding: 12px;
  }
}
</style>
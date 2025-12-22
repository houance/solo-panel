<template>
  <div class="step-3">
    <h3 style="text-align: center; margin-bottom: 24px">第三步：完善信息</h3>

    <div class="confirmation-content">
      <n-form
          ref="formRef"
          :model="step3Data"
          :rules="rules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
          size="medium"
      >
        <n-form-item label="任务流名称" path="flowName">
          <n-input
              v-model:value="step3Data.flowName"
              placeholder="请输入任务流名称"
              @update:value="handleFieldUpdate"
          />
        </n-form-item>

        <n-form-item label="描述" path="description">
          <n-input
              v-model:value="step3Data.description"
              type="textarea"
              placeholder="请输入任务流描述"
              :autosize="{ minRows: 3, maxRows: 5 }"
              @update:value="handleFieldUpdate"
          />
        </n-form-item>

        <n-form-item label="Cron 表达式" path="cron">
          <n-input
              v-model:value="step3Data.cron"
              placeholder="请输入spring boot 六位 cron 表达式, 例如: * * * * * *"
              @update:value="handleFieldUpdate"
          />
        </n-form-item>

        <n-divider style="margin: 30px 0" />
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, defineProps, defineEmits, computed} from 'vue'
import {
  NForm,
  NFormItem,
  NDivider,
  type FormRules,
  type FormInst,
  NInput
} from 'naive-ui'
import type {FlowFormData} from "../../api/jobflow/type.ts";
import {createFlow} from "../../api/jobflow/api.ts";

const props = defineProps<{
  formData: FlowFormData
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:form-data', data: Partial<FlowFormData>): void
  (e: 'validate', isValid: boolean): void
}>()

const formRef = ref<FormInst | null>(null)

// 使用computed包装data, 方便展示
const step3Data = computed(() => props.formData.step3)

// 表单验证规则
const rules: FormRules = {
  cron: [
    { required: true, message: '请输入 Cron 表达式', trigger: ['blur', 'change'] },
    { pattern: /^(\s*(\S+\s+){5}\S+\s*)$/, message: '请输入有效的 Cron 表达式', trigger: ['blur', 'change'] }
  ],
  flowName: [
    { required: true, message: '请输入任务流名称', trigger: ['blur', 'change'] },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: ['blur', 'change'] }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: ['blur', 'change'] },
    { max: 200, message: '描述不能超过 200 个字符', trigger: ['blur', 'change'] }
  ],
}

// 处理字段更新
const handleFieldUpdate = () => {
  emit('update:form-data', { step3: step3Data.value })
}

// 验证方法
const validate = async () => {
  try {
    // 使用 Form 组件的验证
    await formRef.value?.validate()

    // 提交数据
    await createFlow({
      flowName: step3Data.value.flowName,
      cron: step3Data.value.cron,
      description: step3Data.value.description,
      nodeList: props.formData.step1.nodeList,
      fieldSchemaDTOList: props.formData.step2.fieldSchemaDTOList,
    })
  } catch (error) {
    throw error
  }
  return true
}

// 暴露方法给父组件
defineExpose({
  validate
})
</script>

<style scoped>
.step-3 {
  padding: 8px;
}

.confirmation-content {
  padding: 8px;
}
</style>
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
          <div class="cron-input-wrapper">
            <n-select
                v-model:value="selectedPreset"
                :options="cronPresets"
                placeholder="选择预设"
                style="width: 160px; margin-right: 12px"
                @update:value="handlePresetChange"
            />
            <n-input
                v-model:value="step3Data.cron"
                placeholder="请输入 Spring Boot 六位 cron 表达式, 例如: * * * * * *"
                @update:value="handleCronChange"
            />
          </div>
          <div class="cron-hint" v-if="selectedPreset === 'custom' && step3Data.cron">
            当前表达式：{{ step3Data.cron }}
          </div>
        </n-form-item>

        <n-divider style="margin: 30px 0" />
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, defineProps, defineEmits, computed, watch} from 'vue'
import {
  NForm,
  NFormItem,
  NDivider,
  NSelect,
  type FormRules,
  type FormInst,
  NInput,
  type SelectOption
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

// Cron 预设选项
const cronPresets = ref<SelectOption[]>([
  {
    label: '每分钟',
    value: '0 * * * * *',
    description: '每分钟执行一次'
  },
  {
    label: '每30分钟',
    value: '0 */30 * * * *',
    description: '每30分钟执行一次'
  },
  {
    label: '每小时',
    value: '0 0 * * * *',
    description: '每小时执行一次'
  },
  {
    label: '每2小时',
    value: '0 0 */2 * * *',
    description: '每2小时执行一次'
  },
  {
    label: '每4小时',
    value: '0 0 */4 * * *',
    description: '每4小时执行一次'
  },
  {
    label: '每8小时',
    value: '0 0 */8 * * *',
    description: '每8小时执行一次'
  },
  {
    label: '每16小时',
    value: '0 0 */16 * * *',
    description: '每16小时执行一次'
  },
  {
    label: '自定义',
    value: 'custom',
    description: '手动输入表达式'
  }
])

// 当前选中的预设值
const selectedPreset = ref<string>('custom')

// 使用computed包装data
const step3Data = computed(() => props.formData.step3)

// 表单验证规则
const rules: FormRules = {
  cron: [
    { required: true, message: '请输入 Cron 表达式', trigger: ['blur', 'change'] },
    {
      validator: (_rule, value) => {
        if (!value) return new Error('请输入 Cron 表达式')
        // 验证六位 cron 表达式格式
        const parts = value.trim().split(/\s+/)
        if (parts.length !== 6) {
          return new Error('Cron 表达式必须是六位')
        }

        // 验证每个部分的有效性
        const cronRegex = /^(\*|(\*\/[1-9][0-9]*)|([0-9]|[1-5][0-9])(-([0-9]|[1-5][0-9]))?(\/([1-9][0-9]*))?|,)+$/

        // 检查秒部分（0-59）
        if (!cronRegex.test(parts[0]) && parts[0] !== '*') {
          return new Error('秒部分格式错误 (0-59)')
        }

        // 检查分部分（0-59）
        if (!cronRegex.test(parts[1]) && parts[1] !== '*') {
          return new Error('分钟部分格式错误 (0-59)')
        }

        // 检查小时部分（0-23）
        if (!cronRegex.test(parts[2]) && parts[2] !== '*') {
          return new Error('小时部分格式错误 (0-23)')
        }

        // 检查日期部分（1-31）
        if (!cronRegex.test(parts[3]) && parts[3] !== '*') {
          return new Error('日期部分格式错误 (1-31)')
        }

        // 检查月份部分（1-12 或 JAN-DEC）
        const monthRegex = /^(\*|(\*\/[1-9][0-9]*)|([1-9]|1[0-2])(-([1-9]|1[0-2]))?(\/([1-9][0-9]*))?|,|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)+$/
        if (!monthRegex.test(parts[4].toUpperCase()) && parts[4] !== '*') {
          return new Error('月份部分格式错误 (1-12 或 JAN-DEC)')
        }

        // 检查星期部分（0-6 或 SUN-SAT）
        const dayOfWeekRegex = /^(\*|(\*\/[1-9][0-9]*)|([0-6])(-([0-6]))?(\/([1-9][0-9]*))?|,|SUN|MON|TUE|WED|THU|FRI|SAT)+$/
        if (!dayOfWeekRegex.test(parts[5].toUpperCase()) && parts[5] !== '*') {
          return new Error('星期部分格式错误 (0-6 或 SUN-SAT)')
        }

        return true
      },
      trigger: ['blur', 'change']
    }
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

// 监听初始值，如果匹配预设则选中
watch(() => step3Data.value.cron, (newCron) => {
  if (!newCron) return

  // 查找是否匹配预设
  const matchedPreset = cronPresets.value.find(preset =>
      preset.value !== 'custom' && preset.value === newCron
  )

  if (matchedPreset) {
    selectedPreset.value = matchedPreset.value as string
  } else {
    selectedPreset.value = 'custom'
  }
}, { immediate: true })

// 处理预设选择变化
const handlePresetChange = (value: string) => {
  if (value !== 'custom') {
    step3Data.value.cron = value
    handleFieldUpdate()
  }
}

// 处理 cron 输入变化
const handleCronChange = () => {
  // 当手动输入时，自动切换到自定义模式
  if (selectedPreset.value !== 'custom') {
    selectedPreset.value = 'custom'
  }
  handleFieldUpdate()
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

.cron-input-wrapper {
  display: flex;
  align-items: center;
}

.cron-hint {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
<template>
  <n-modal
      v-model:show="showModal"
      preset="dialog"
      title="创建任务流"
      :show-icon="false"
      :mask-closable="false"
      style="width: 1200px;height: 600px"
      @afterLeave="closeModal"
  >
    <template #header>
      <div style="text-align: center; width: 100%">
        <n-steps :current="currentStep" :status="currentStatus">
          <n-step title="节点编排" />
          <n-step title="参数填写" />
          <n-step title="确认" />
        </n-steps>
      </div>
    </template>

    <div class="step-content">
      <!-- 动态渲染步骤组件 -->
      <Step1NodesArrange
          v-if="currentStep === 1"
          ref="stepRef"
          :form-data="formData.step1"
          :loading="loading"
          @update:form-data="updateFormData"
      />

      <Step2FieldSchema
          v-else-if="currentStep === 2"
          ref="stepRef"
          :form-data="formData"
          :loading="loading"
          @update:form-data="updateFormData"
      />

      <Step3Confirmation
          v-else-if="currentStep === 3"
          ref="stepRef"
          :form-data="formData"
          :loading="loading"
          @update:form-data="updateFormData"
      />
    </div>

    <template #action>
      <div style="display: flex; justify-content: space-between;">
        <n-button
            v-if="currentStep > 1"
            @click="prevStep"
            :disabled="loading"
        >
          上一步
        </n-button>
        <div v-else></div> <!-- 占位 -->

        <n-button
            type="primary"
            @click="nextStep"
            :loading="loading"
        >
          {{ currentStep === 3 ? '完成' : '下一步' }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, nextTick } from 'vue'
import {NModal, NSteps, NStep, NButton, useMessage} from 'naive-ui'
import Step1NodesArrange from './Step1NodesArrange.vue'
import Step2FieldSchema from './Step2FieldSchema.vue'
import Step3Confirmation from './Step3Confirmation.vue'
import type {CreateFlowRequest, FlowFormData} from "../../api/jobflow/type.ts";

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success', data: CreateFlowRequest): void
}>()

const currentStep = ref(1)
const loading = ref(false)
const currentStatus = ref<'process' | 'error' | 'finish'>('process')
const stepRef = ref<InstanceType<typeof Step1NodesArrange | typeof Step2FieldSchema | typeof Step3Confirmation>>()

// 添加消息提示
const message = useMessage()

// 初始化表单数据
const createEmptyFormData = (): FlowFormData => {
  return {
    step1: {
      nodeList: []
    },
    step2: {
      fieldSchemaDTOList: []
    },
    step3: {
      flowName: '',
      cron: '',
      description: '',
    }
  }
}
const formData = ref<FlowFormData>(createEmptyFormData())

const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 更新表单数据
const updateFormData = (data: Partial<FlowFormData>) => {
  formData.value = { ...formData.value, ...data }
}

// 下一步
const nextStep = async () => {
  loading.value = true

  try {
    // 调用当前步骤组件的验证方法
    console.log(`开始验证第${currentStep.value}步数据`)
    if (stepRef.value && typeof stepRef.value.validate === 'function') {
      const isValid = await stepRef.value.validate()

      if (isValid) {
        // 验证成功，进入下一步
        console.log(`第${currentStep.value}步数据验证成功`)
        await goToNextStep()
      } else {
        // 这种情况不应该发生，因为 validate 应该返回 true 或抛出错误
        // 但作为兜底处理
        currentStatus.value = 'error'
        message.error(`第${currentStep.value}步验证失败`, {
          closable: true,
          duration: 10000
        })
      }
    } else {
      // 如果组件没有验证方法，直接进入下一步
      await goToNextStep()
    }
  } catch (error: any) {
    currentStatus.value = 'error'
    console.error(`第${currentStep.value}步骤验证失败:`, error)

    // 显示具体的错误消息
    const errorMsg = error.message || error.toString()
    message.error(errorMsg, {
      closable: true,
      duration: 10000
    })
  } finally {
    loading.value = false
  }
}

// 进入下一步
const goToNextStep = async () => {
  if (currentStep.value < 3) {
    currentStep.value++
    currentStatus.value = 'process'
    // 等待 DOM 更新后重新获取 ref
    await nextTick()
  } else {
    // 第三步完成，提交
    emit('success', {
      flowName: formData.value.step3.flowName,
      cron: formData.value.step3.cron,
      description: formData.value.step3.description,
      nodeList: formData.value.step1.nodeList,
      fieldSchemaDTOList: formData.value.step2.fieldSchemaDTOList,
    })
    closeModal()
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    currentStatus.value = 'process'
  }
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const resetForm = () => {
  currentStep.value = 1
  currentStatus.value = 'process'
  formData.value = createEmptyFormData()
}
</script>

<style scoped>
.step-content {
  margin: 20px 0;
  min-height: 200px;
}
</style>
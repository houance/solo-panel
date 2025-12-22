export interface FlowResponse<T> {
    statusCode: number
    message: string
    data: T
    timestamp: string
}

export interface FlowInfoDTO {
    flowDefinitionId: string
    flowName: string
    cronConfig: string
    lastExecutionExecStatus: "RUNNING" | "SUCCESS" | "FAILED" | "PENDING"
    lastExecutionDuration: string
    enabled: 1 | 0
}

export interface FieldSchemaDTO {
    nodeId: string
    nodeName: string
    fieldSchemaMap: Map<string, FieldSchema>
}

export interface FieldSchema {
    sourceType: 'MANUAL' | 'NODE_OUTPUT',
    typeReference: string,
    description: string,
    group: string,
    value: any
}

export interface CreateFlowRequest {
    flowName: string
    cron: string
    description: string
    nodeList: FlowNode[]
    fieldSchemaDTOList: FieldSchemaDTO[]
}

export interface FlowNode {
    nodeId: string
    name: string
    nextNodeIds: string[]
}

export interface FlowDefinitionEntity {
    flowDefinitionId: string
    name: string
    description: string
    definition: {name: string, nodes: FlowNode[]}
    cronConfig: string
    enabled: number
}

export interface Node {
    name: string
    description: string
    group: string
    inputParams: string[]
    outputParams: string[]
}

// modal types, 不参与后端 api 交互
// 定义表单数据类型
export interface FlowFormData {
    step1: {
        nodeList: CreateFlowRequest["nodeList"]
    }
    step2: {
        fieldSchemaDTOList: CreateFlowRequest["fieldSchemaDTOList"]
    }
    step3: {
        flowName: string
        cron: string
        description: string
    }
}
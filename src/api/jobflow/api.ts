import type {
    CreateFlowRequest,
    FieldSchemaDTO,
    FlowDefinitionEntity,
    FlowInfoDTO,
    FlowNode,
    FlowResponse,
    Node
} from "./type.ts";
import { restAxiosInstance } from "../../utils/http.ts"

const flowEditorUrl:string = "/flow-editor";
const flowInfoUrl:string = "/flow-info";

export async function validNodes(payload: FlowNode[]) {
    await restAxiosInstance.post<FlowResponse<null>>(flowEditorUrl + "/valid-nodes", payload);
}

export async function getFieldSchema(payload: FlowNode[]): Promise<FieldSchemaDTO[]> {
    const response =
        await restAxiosInstance.post<FlowResponse<FieldSchemaDTO[]>>(flowEditorUrl + "/get-field-schema", payload);
    return response.data.data;
}

export async function validFieldSchema(payload: FieldSchemaDTO[]) {
    await restAxiosInstance.post<FlowResponse<null>>(flowEditorUrl + "/valid-field-schema", payload);
}

export async function createFlow(payload: CreateFlowRequest): Promise<FlowDefinitionEntity> {
    const response =
        await restAxiosInstance.post<FlowResponse<FlowDefinitionEntity>>(flowEditorUrl + "/create-flow", payload);
    return response.data.data;
}

export async function getAllNodes(): Promise<Node[]> {
    const response =
        await restAxiosInstance.get<FlowResponse<Node[]>>(flowEditorUrl + "/get-all-nodes");
    return response.data.data;
}

export async function getAllFlowInfo(): Promise<FlowInfoDTO[]> {
    const response =
        await restAxiosInstance.get<FlowResponse<FlowInfoDTO[]>>(flowInfoUrl + "/get-all-flow-info");
    return response.data.data;
}

export async function enableFlow(payload: FlowInfoDTO) {
    await restAxiosInstance.post<FlowResponse<null>>(flowInfoUrl + "/enable-flow", payload);
}

export async function disableFlow(payload: FlowInfoDTO) {
    await restAxiosInstance.post<FlowResponse<null>>(flowInfoUrl + "/disable-flow", payload);
}

export async function deleteFlow(payload: FlowInfoDTO) {
    await restAxiosInstance.post<FlowResponse<null>>(flowInfoUrl + "/delete-flow", payload);
}
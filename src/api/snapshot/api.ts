import type {FlowResponse} from "../FlowResponse.ts";
import {blobAxiosInstance, restAxiosInstance} from "../../utils/http.ts"
import type {RestoreRequest, SnapshotItemDTO, SnapshotMetaEntity} from "./type.ts";
import type {AxiosResponse} from "axios";

const resticUrl:string = "/restic";

export async function getAllSnapshots(): Promise<SnapshotMetaEntity[]> {
    const response = await restAxiosInstance.get<FlowResponse<SnapshotMetaEntity[]>>(
        resticUrl + "/get-all-snapshots"
    );
    return response.data.data;
}

export async function getSnapshotItems(snapshotMetaEntity: SnapshotMetaEntity, filter: string)
    : Promise<SnapshotItemDTO[]> {
    const response = await restAxiosInstance.post<FlowResponse<SnapshotItemDTO[]>>(
        resticUrl + "/get-snapshot-items",
        snapshotMetaEntity,
        {
            params: {
                filter: filter
            }
        }
    );
    return response.data.data;
}

export async function submitDownloadJob(payload: RestoreRequest): Promise<string> {
    const response = await restAxiosInstance.post<FlowResponse<string>>(
        resticUrl + "/submit-download-job",
        payload
    );
    return response.data.data;
}

export async function getDownloadResult(jobId: string, isPreview: boolean): Promise<AxiosResponse<Blob>> {
    return await blobAxiosInstance.post<Blob>(
        resticUrl + "/get-download-result",
        null,
        {
            params: {
                jobId: jobId,
                isPreview: isPreview,
            },
            responseType: "blob",
        },
    );
}


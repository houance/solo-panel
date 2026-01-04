export interface SnapshotMetaEntity {
    snapshotMetaId: string;
    sourceDirectory: string;
    backupRepository: string;
    createdAt: string;
    snapshotId: string;
    fileCount: string;
    dirCount: string;
    snapshotSizeBytes: string;
    hostname: string;
    username: string;
}

export interface SnapshotItemDTO {
    name: string;
    type: 'file' | 'dir';
    path: string;
    size: number;
    ctime: string;
}

export interface RestoreRequest {
    snapshotMetaEntity: SnapshotMetaEntity;
    snapshotItemDTOList: SnapshotItemDTO[];
}

// view 内使用的数据, 不与后端交互
export interface GroupData {
    sourceDirectory: string
    snapshotCount: number
    totalFileCount: number
    totalDirCount: number
    totalSize: number // 总字节数
    snapshots: SnapshotMetaEntity[]
}
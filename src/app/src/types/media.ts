import type { BaseItem } from './item'

export interface MediaConfig {
  external: boolean
  publicUrl?: string
}

export interface MediaItem extends BaseItem {
  [key: string]: unknown
}

export enum MediaUploadStatus {
  Uploading = 'uploading',
  Success = 'success',
  Error = 'error',
}

export interface MediaUploadTask {
  id: string
  name: string
  size: number
  progress: number
  status: MediaUploadStatus
  error?: string
}

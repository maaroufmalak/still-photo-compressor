import type { ImageInfo, ProcessingOptions, ProcessedImage, ThumbnailResult } from './types.js';
export type WorkerRequestType = 'init' | 'load' | 'getMetadata' | 'getThumbnail' | 'process' | 'convert' | 'reset' | 'dispose';
export interface WorkerRequest {
    id: number;
    type: WorkerRequestType;
    data?: ArrayBuffer;
    filename?: string;
    options?: ProcessingOptions;
    coreUrl?: string;
    wasmUrl?: string;
}
export interface WorkerResponse {
    id: number;
    type: 'result' | 'error';
    result?: ImageInfo | ProcessedImage | ThumbnailResult | null;
    error?: string;
    transfer?: ArrayBuffer[];
}
export interface WorkerInitOptions {
    workerUrl?: string | URL;
    coreUrl?: string;
    wasmUrl?: string;
}

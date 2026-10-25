import type { ImageInfo, ProcessingOptions, ProcessedImage, ThumbnailResult } from './types.js';
import type { WorkerInitOptions } from './worker-types.js';
export type { WorkerInitOptions };
export declare class RawConvertWorker {
    private bridge;
    private constructor();
    static init(options?: WorkerInitOptions): Promise<RawConvertWorker>;
    load(data: ArrayBuffer, filename?: string): Promise<ImageInfo>;
    getMetadata(): Promise<ImageInfo>;
    getThumbnail(): Promise<ThumbnailResult>;
    process(options?: ProcessingOptions): Promise<ProcessedImage>;
    convert(data: ArrayBuffer, options?: ProcessingOptions): Promise<ProcessedImage>;
    reset(): Promise<void>;
    dispose(): void;
}

import type { ImageInfo, ProcessingOptions, ProcessedImage, ThumbnailResult, InternalProcessingOptions } from './types.js';
export type { ImageInfo, ProcessingOptions, ProcessedImage, ThumbnailResult };
/** Options for `RawConvert.init()`. Mirrors `RawConvertWorker.init()`'s URL overrides. */
export interface RawConvertInitOptions {
    /** URL of the Emscripten glue script (`rawconvert-core.js`). Defaults to the copy next to this module. */
    coreUrl?: string;
    /** URL of `rawconvert-core.wasm`. Defaults to whatever the glue script resolves relative to itself. */
    wasmUrl?: string;
}
export declare const COLOR_SPACE_MAP: Record<string, number>;
export declare const INTERPOLATION_MAP: Record<string, number>;
export declare function toInternalOptions(opts?: ProcessingOptions): InternalProcessingOptions;
export declare class RawConvert {
    private module;
    private processor;
    private constructor();
    static init(options?: RawConvertInitOptions): Promise<RawConvert>;
    load(data: ArrayBuffer, filename?: string): ImageInfo;
    getMetadata(): ImageInfo;
    getThumbnail(): ThumbnailResult;
    process(options?: ProcessingOptions): ProcessedImage;
    convert(data: ArrayBuffer, options?: ProcessingOptions): ProcessedImage;
    reset(): void;
    dispose(): void;
}

export interface ImageInfo {
    width: number;
    height: number;
    rawWidth: number;
    rawHeight: number;
    colors: number;
    bitsPerSample: number;
    isoSpeed: number;
    shutter: number;
    aperture: number;
    focalLength: number;
    cameraMake: string;
    cameraModel: string;
    lens: string;
    timestamp: string;
    software: string;
    rawFormat: string;
    hasGps: boolean;
    gpsLatitude: number;
    gpsLongitude: number;
    gpsAltitude: number;
    orientation: number;
    flipValue: number;
}
export interface ProcessingOptions {
    colorSpace?: 'raw' | 'srgb' | 'adobe' | 'wide-gamut' | 'prophoto' | 'xyz';
    interpolation?: 'linear' | 'vng' | 'ppg' | 'ahd' | 'dcb' | 'dht' | 'aahd';
    outputBps?: 8 | 16;
    halfSize?: boolean;
    autoWhiteBalance?: boolean;
    cameraWhiteBalance?: boolean;
    brightness?: number;
    highlightMode?: number;
    noiseReduction?: number;
    medianPasses?: number;
}
export interface ProcessedImage {
    width: number;
    height: number;
    colors: number;
    bitsPerSample: number;
    data: Uint8Array | Uint16Array;
}
export interface ThumbnailResult {
    width: number;
    height: number;
    format: 'jpeg' | 'bitmap';
    data: Uint8Array;
}
export interface InternalProcessingOptions {
    colorSpace: number;
    interpolation: number;
    outputBps: number;
    halfSize: boolean;
    autoWhiteBalance: boolean;
    cameraWhiteBalance: boolean;
    brightness: number;
    highlightMode: number;
    noiseReduction: number;
    medianPasses: number;
}
export interface RawProcessorInstance {
    loadFromFile(path: string): boolean;
    getMetadata(): ImageInfo;
    extractThumbnail(outputPath: string): boolean;
    getThumbnailInfo(): {
        width: number;
        height: number;
        format: number;
        dataLength: number;
    };
    process(opts: InternalProcessingOptions): boolean;
    getProcessedImageInfo(): {
        width: number;
        height: number;
        colors: number;
        bitsPerSample: number;
        dataLength: number;
    };
    exportProcessed(outputPath: string): boolean;
    exportRawPixels(outputPath: string): boolean;
    isLoaded(): boolean;
    getLastError(): string;
    reset(): void;
    delete(): void;
}
export interface RawConvertCoreModule {
    RawProcessor: new () => RawProcessorInstance;
    FS: {
        writeFile(path: string, data: Uint8Array): void;
        readFile(path: string): Uint8Array;
        unlink(path: string): void;
    };
}

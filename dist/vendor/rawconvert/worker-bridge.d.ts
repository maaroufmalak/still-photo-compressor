import type { WorkerRequest } from './worker-types.js';
export declare class WorkerBridge {
    private worker;
    private nextId;
    private pending;
    constructor(worker: Worker);
    send(request: Omit<WorkerRequest, 'id'>, transfer?: Transferable[]): Promise<any>;
    terminate(): void;
}

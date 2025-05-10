import { PrioritizedDynamicBatchedPromiseQueue } from './PrioritizedDynamicBatchedPromiseQueue.ts';
import { type IPromiseQueue, type PromiseCreator } from './PromiseQueue.ts';

export class DynamicBatchedPromiseQueue implements IPromiseQueue {
    private batchedQueue: PrioritizedDynamicBatchedPromiseQueue;
    constructor(batchSize: number) {
        this.batchedQueue = new PrioritizedDynamicBatchedPromiseQueue(
            batchSize,
        );
    }

    enqueue<T>(task: PromiseCreator<T>): Promise<T> {
        return this.batchedQueue.enqueue(task);
    }

    waitIdle() {
        return this.batchedQueue.waitIdle();
    }
}

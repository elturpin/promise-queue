import { PrioritizedDynamicBatchedPromiseQueue } from './PrioritizedDynamicBatchedPromiseQueue';
import { type IPromiseQueue, type PromiseCreator } from './PromiseQueue';

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

import {
    type IPromiseQueue,
    PromiseQueue,
    type PromiseCreator,
} from './PromiseQueue';

export class RollingBatchedPromiseQueue implements IPromiseQueue {
    private queues: PromiseQueue[];
    private queueIndex = -1;
    constructor(private readonly batchSize: number) {
        this.queues = Array.from({ length: batchSize }).map(
            () => new PromiseQueue(),
        );
    }

    async enqueue<T>(task: PromiseCreator<T>): Promise<T> {
        this.queueIndex = (this.queueIndex + 1) % this.batchSize;
        return this.queues[this.queueIndex].enqueue(task);
    }
}

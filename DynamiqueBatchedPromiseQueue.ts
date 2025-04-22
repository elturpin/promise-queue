import {
    type IPromiseQueue,
    PromiseQueue,
    type PromiseCreator,
} from './PromiseQueue.js';

export class DynamiqueBatchedPromiseQueue implements IPromiseQueue {
    private queueRacers: (number | Promise<number>)[] = [];
    private operationSerializer = new PromiseQueue();
    constructor(batchSize: number) {
        Array.from({ length: batchSize }).forEach((_, index) => {
            this.queueRacers.push(index);
        });
    }

    async enqueue<T>(callback: PromiseCreator<T>): Promise<T> {
        let result: Promise<T>;

        const later = this.operationSerializer.enqueue(async () => {
            const queueIndex = await Promise.race(this.queueRacers);
            result = callback();
            this.queueRacers[queueIndex] = result.then(() => queueIndex);
        });

        return later.then(() => result);
    }
}

import {
    type IPromiseQueue,
    PromiseQueue,
    type PromiseCreator,
} from './PromiseQueue';
import { range } from './range';

export async function beginTaskOnPool<T>(
    task: PromiseCreator<T>,
    poolIndexer: (number | Promise<number>)[],
) {
    const poolIndex = await Promise.race(poolIndexer);
    const result = task();
    poolIndexer[poolIndex] = result.then(
        () => poolIndex,
        () => poolIndex,
    );
    return () => result;
}

export class DynamicBatchedPromiseQueue implements IPromiseQueue {
    private poolIndexer: (number | Promise<number>)[];
    private operationSerializer = new PromiseQueue();
    constructor(batchSize: number) {
        this.poolIndexer = range(batchSize);
    }

    enqueue<T>(task: PromiseCreator<T>): Promise<T> {
        const afterTaskExecution = this.operationSerializer.enqueue(() =>
            beginTaskOnPool(task, this.poolIndexer),
        );

        return afterTaskExecution.then((promiseReturner) => promiseReturner());
    }
}

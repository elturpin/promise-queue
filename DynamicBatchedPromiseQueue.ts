import {
    type IPromiseQueue,
    PromiseQueue,
    type PromiseCreator,
} from './PromiseQueue';

export async function executeTaskOnWorker<T>(
    task: PromiseCreator<T>,
    workerIndexer: (number | Promise<number>)[],
) {
    const queueIndex = await Promise.race(workerIndexer);
    const result = task();
    workerIndexer[queueIndex] = result.then(
        () => queueIndex,
        () => queueIndex,
    );
    return () => result;
}

export class DynamicBatchedPromiseQueue implements IPromiseQueue {
    private workersIndexer: (number | Promise<number>)[] = [];
    private operationSerializer = new PromiseQueue();
    constructor(batchSize: number) {
        Array.from({ length: batchSize }).forEach((_, index) => {
            this.workersIndexer.push(index);
        });
    }

    async enqueue<T>(task: PromiseCreator<T>): Promise<T> {
        const afterTaskExecution = this.operationSerializer.enqueue(() =>
            executeTaskOnWorker(task, this.workersIndexer),
        );

        return afterTaskExecution.then((promiseReturner) => promiseReturner());
    }
}

import { executeTaskOnWorker } from './DynamicBatchedPromiseQueue';
import {
    PrioritizedPromiseQueue,
    type IPrioritizedPromiseQueue,
} from './PrioritizedPromiseQueue';
import { type PromiseCreator } from './PromiseQueue';

export class PrioritizedDynamicBatchedPromiseQueue
    implements IPrioritizedPromiseQueue
{
    private workersIndexer: (number | Promise<number>)[] = [];
    private operationSerializer = new PrioritizedPromiseQueue();
    constructor(batchSize: number) {
        Array.from({ length: batchSize }).forEach((_, index) => {
            this.workersIndexer.push(index);
        });
    }

    async enqueue<T>(
        task: PromiseCreator<T>,
        prioritize?: boolean,
    ): Promise<T> {
        const afterTaskExecution = this.operationSerializer.enqueue(
            () => executeTaskOnWorker(task, this.workersIndexer),
            prioritize,
        );

        return afterTaskExecution.then((promiseReturner) => promiseReturner());
    }
}

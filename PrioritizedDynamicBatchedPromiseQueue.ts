import { beginTaskOnPool } from './DynamicBatchedPromiseQueue';
import {
    PrioritizedPromiseQueue,
    type IPrioritizedPromiseQueue,
} from './PrioritizedPromiseQueue';
import { type PromiseCreator } from './PromiseQueue';
import { range } from './range';

export class PrioritizedDynamicBatchedPromiseQueue
    implements IPrioritizedPromiseQueue
{
    private poolIndexer: (number | Promise<number>)[];
    private operationSerializer = new PrioritizedPromiseQueue();
    private lastResultPromise = Promise.resolve();
    private executingTasks = 0;
    constructor(batchSize: number) {
        this.poolIndexer = range(batchSize);
    }

    enqueue<T>(task: PromiseCreator<T>, prioritize?: boolean): Promise<T> {
        const afterTaskBegun = this.operationSerializer.enqueue(
            () => beginTaskOnPool(task, this.poolIndexer),
            prioritize,
        );
        const resultPromise = afterTaskBegun.then((promiseReturner) =>
            promiseReturner(),
        );
        this.lastResultPromise = resultPromise
            .then(
                () => {},
                () => {},
            )
            .finally(() => {
                this.executingTasks--;
            });
        this.executingTasks++;
        return resultPromise;
    }

    async waitIdle() {
        if (!this.isIdle) {
            await this.lastResultPromise;
            await this.waitIdle();
        }
    }

    private get isIdle() {
        return this.executingTasks === 0;
    }
}

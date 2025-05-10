type PromiseCreator<T> = () => Promise<T>;

class PromiseQueue {
    private actualPromise = Promise.resolve();
    private pendingTask = 0;
    async enqueue<T>(task: PromiseCreator<T>): Promise<T> {
        const newPromise = this.actualPromise.then(() => task());
        this.actualPromise = newPromise
            .then(
                function () {},
                function () {},
            )
            .finally(() => {
                this.pendingTask--;
            });
        this.pendingTask++;
        return newPromise;
    }

    async waitIdle() {
        if (!this.isIdle) {
            await this.actualPromise;
            await this.waitIdle();
        }
    }

    private get isIdle() {
        return this.pendingTask === 0;
    }
}

class PrioritizedPromiseQueue {
    private queue = new PromiseQueue();
    private prioritizedQueue = new PromiseQueue();

    constructor() {
        this.prioritizedQueue.enqueue(() => Promise.resolve());
    }

    async enqueue<T>(
        task: PromiseCreator<T>,
        prioritize?: boolean,
    ): Promise<T> {
        if (prioritize) {
            return this.prioritizedQueue.enqueue(task);
        }

        await this.prioritizedQueue.waitIdle();
        return this.queue.enqueue(task);
    }
}

function range(size: number): number[] {
    return Array.from({ length: size }).map((_, index) => {
        return index;
    });
}

export class PrioritizedDynamicBatchedPromiseQueue {
    private poolIndexer: (number | Promise<number>)[];
    private taskAssignmentQueue = new PrioritizedPromiseQueue();
    private lastResultPromise = Promise.resolve();
    private executingTasks = 0;
    constructor(batchSize: number) {
        this.poolIndexer = range(batchSize);
    }

    private async assignAndBeginTaskOnPool<T>(task: PromiseCreator<T>) {
        const poolIndex = await Promise.race(this.poolIndexer);
        const result = task();
        this.poolIndexer[poolIndex] = result.then(
            () => poolIndex,
            () => poolIndex,
        );
        return () => result;
    }

    enqueue<T>(task: PromiseCreator<T>, prioritize?: boolean): Promise<T> {
        const afterTaskBegun = this.taskAssignmentQueue.enqueue(
            () => this.assignAndBeginTaskOnPool(task),
            prioritize,
        );
        const resultPromise = afterTaskBegun.then((getResultPromise) =>
            getResultPromise(),
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

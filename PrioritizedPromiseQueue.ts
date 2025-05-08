import { PromiseQueue, type PromiseCreator } from './PromiseQueue';

export interface IPrioritizedPromiseQueue {
    enqueue<T>(task: PromiseCreator<T>, prioritize?: boolean): Promise<T>;
}

export class PrioritizedPromiseQueue implements IPrioritizedPromiseQueue {
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

    async waitIdle() {
        if (!this.isIdle) {
            await Promise.all([
                this.prioritizedQueue.waitIdle(),
                this.queue.waitIdle(),
            ]).then(() => this.waitIdle());
        }
        return Promise.resolve();
    }

    get isIdle() {
        return this.prioritizedQueue.isIdle && this.queue.isIdle;
    }
}

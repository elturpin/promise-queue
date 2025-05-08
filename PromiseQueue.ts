export interface IPromiseQueue {
    enqueue<T>(task: PromiseCreator<T>): Promise<T>;
}

export type PromiseCreator<T> = () => Promise<T>;

export class PromiseQueue implements IPromiseQueue {
    private actualPromise: Promise<void> = Promise.resolve();
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
            await this.actualPromise.then(() => this.waitIdle());
        }
        return Promise.resolve();
    }

    get isIdle() {
        return this.pendingTask === 0;
    }
}

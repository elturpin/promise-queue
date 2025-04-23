export interface IPromiseQueue {
    enqueue<T>(task: PromiseCreator<T>): Promise<T>;
}

export type PromiseCreator<T> = () => Promise<T>;

export class PromiseQueue implements IPromiseQueue {
    private actualPromise: Promise<void> = Promise.resolve();
    async enqueue<T>(task: PromiseCreator<T>): Promise<T> {
        const newPromise = this.actualPromise.then(() => task());
        this.actualPromise = newPromise.then(
            function () {},
            function () {},
        );
        return newPromise;
    }
}

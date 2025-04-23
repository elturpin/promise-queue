export interface IPromiseQueue {
    enqueue<T>(callback: PromiseCreator<T>): Promise<T>;
}

export type PromiseCreator<T> = () => Promise<T>;

export class PromiseQueue implements IPromiseQueue {
    private actualPromise: Promise<void> = Promise.resolve();
    async enqueue<T>(callback: PromiseCreator<T>): Promise<T> {
        const newPromise = this.actualPromise.then(() => callback());
        this.actualPromise = newPromise.then(
            function () {},
            function () {},
        );
        return newPromise;
    }
}

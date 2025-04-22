import { describe, expect, it, vi } from 'vitest';
import { PromiseQueue } from './PromiseQueue.js';
import { DynamiqueBatchedPromiseQueue } from './DynamiqueBatchedPromiseQueue.js';
import { RollingBatchedPromiseQueue } from './RollingBatchedPromiseQueue.js';
import { setTimeout } from 'timers/promises';

type DeferredPromise<T> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
};

function deferPromise<T>(): DeferredPromise<T> {
    let resolve: (value: T | PromiseLike<T>) => void = () => {};
    let reject: (reason?: any) => void = () => {};
    const promise = new Promise<T>((res, rej) => {
        [resolve, reject] = [res, rej];
    });

    return { promise, resolve, reject };
}

function createTask() {
    const { promise, resolve, reject } = deferPromise<number>();

    const task = vi.fn(() => promise);

    return { task, resolve, reject };
}

const WAIT_TIME = 10;

describe('PromiseQueue', () => {
    describe('with 1 promise', () => {
        it('should return a promise', async () => {
            const queue = new PromiseQueue();
            const { task } = createTask();

            const result = queue.enqueue(task);

            expect(result).toBeInstanceOf(Promise);
        });

        it('should eventually execute the first task', async () => {
            const queue = new PromiseQueue();
            const { task } = createTask();

            queue.enqueue(task);

            await setTimeout(WAIT_TIME);

            expect(task).toHaveBeenCalled();
        });

        it('should resolve the returned promise if the task is resolved', async () => {
            const queue = new PromiseQueue();
            const { task, resolve } = createTask();

            const result = queue.enqueue(task);

            resolve(42);

            await expect(result).resolves.toBe(42);
        });
    });

    describe('with 2 promises', () => {
        it('should not execute the second task, if the first is not resolved', async () => {
            const queue = new PromiseQueue();
            const { task: task1 } = createTask();
            const { task: task2 } = createTask();
            queue.enqueue(task1);
            await setTimeout(WAIT_TIME);

            queue.enqueue(task2);

            expect(task2).not.toHaveBeenCalled();
        });

        it('should execute the second task, if the first is resolved', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve } = createTask();
            const { task: task2 } = createTask();
            queue.enqueue(task1);
            queue.enqueue(task2);

            resolve(42);
            await setTimeout(WAIT_TIME);

            expect(task2).toHaveBeenCalled();
        });

        it('should resolve the 2nd returns if it resolves', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve: resolve1 } = createTask();
            const { task: task2, resolve: resolve2 } = createTask();
            queue.enqueue(task1);
            const result2 = queue.enqueue(task2);

            resolve1(42);
            await setTimeout(WAIT_TIME);
            resolve2(43);

            await expect(result2).resolves.toBe(43);
        });

        it('should eventually execute the second task if the first is resolved before queuing', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve } = createTask();
            const { task: task2 } = createTask();
            const result = queue.enqueue(task1);
            resolve(42);
            await result;

            queue.enqueue(task2);
            await setTimeout(WAIT_TIME);

            expect(task2).toHaveBeenCalled();
        });
    });

    describe('with 3 promises', () => {
        it('should not execute the third task, if the second is not resolved but the first is', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve } = createTask();
            const { task: task2 } = createTask();
            const { task: task3 } = createTask();
            queue.enqueue(task1);
            queue.enqueue(task2);
            queue.enqueue(task3);

            resolve(42);
            await setTimeout(WAIT_TIME);

            expect(task3).not.toHaveBeenCalled();
        });

        it('should execute the third task, if the second is resolved', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve: resolve1 } = createTask();
            const { task: task2, resolve: resolve2 } = createTask();
            const { task: task3 } = createTask();
            queue.enqueue(task1);
            queue.enqueue(task2);
            queue.enqueue(task3);

            resolve1(42);
            await setTimeout(WAIT_TIME);
            resolve2(43);
            await setTimeout(WAIT_TIME);

            expect(task3).toHaveBeenCalled();
        });

        it('should not execute the third task if added after the first has resolved', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve } = createTask();
            const { task: task2 } = createTask();
            const { task: task3 } = createTask();
            queue.enqueue(task1);
            queue.enqueue(task2);
            resolve(42);
            await setTimeout(WAIT_TIME);

            queue.enqueue(task3);
            await setTimeout(WAIT_TIME);

            expect(task3).not.toHaveBeenCalled();
        });
    });
});

describe('RollingBatchedPromiseQueue', () => {
    it('should eventually execute all tasks if number is under batch size', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
        const { task: task1 } = createTask();
        const { task: task2 } = createTask();

        queue.enqueue(task1);
        queue.enqueue(task2);
        await setTimeout(WAIT_TIME);

        expect(task1).toHaveBeenCalled();
        expect(task2).toHaveBeenCalled();
    });

    it('should note execute the next batch if the first is not resolved', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
        const { task: task1 } = createTask();
        const { task: task2 } = createTask();
        const { task: task3 } = createTask();
        const { task: task4 } = createTask();
        queue.enqueue(task1);
        queue.enqueue(task2);
        await setTimeout(WAIT_TIME);

        queue.enqueue(task3);
        queue.enqueue(task4);

        expect(task3).not.toHaveBeenCalled();
        expect(task4).not.toHaveBeenCalled();
    });

    it('should execute the next batch if the first is resolved', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
        const { task: task1, resolve: resolve1 } = createTask();
        const { task: task2, resolve: resolve2 } = createTask();
        const { task: task3 } = createTask();
        const { task: task4 } = createTask();
        queue.enqueue(task1);
        queue.enqueue(task2);
        queue.enqueue(task3);
        queue.enqueue(task4);

        resolve1(1);
        resolve2(2);

        await setTimeout(WAIT_TIME);

        expect(task3).toHaveBeenCalled();
        expect(task4).toHaveBeenCalled();
    });

    it('should execute the third task only if the first task is resolved', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
        const { task: task1, resolve: resolve1 } = createTask();
        const { task: task2 } = createTask();
        const { task: task3 } = createTask();
        const { task: task4 } = createTask();
        queue.enqueue(task1);
        queue.enqueue(task2);
        queue.enqueue(task3);
        queue.enqueue(task4);

        resolve1(1);
        await setTimeout(WAIT_TIME);

        expect(task3).toHaveBeenCalled();
        expect(task4).not.toHaveBeenCalled();
    });
});

describe('DynamiqueBatchedPromiseQueue', () => {
    it('should execute all tasks if number is under batch size', async () => {
        const queue = new DynamiqueBatchedPromiseQueue(2);
        const { task: task1 } = createTask();
        const { task: task2 } = createTask();
        queue.enqueue(task1);
        queue.enqueue(task2);

        await setTimeout(WAIT_TIME);

        expect(task1).toHaveBeenCalled();
        expect(task2).toHaveBeenCalled();
    });

    it('should not execute nest tasks if first batch has not resolved', async () => {
        const queue = new DynamiqueBatchedPromiseQueue(2);
        const { task: task1 } = createTask();
        const { task: task2 } = createTask();
        const { task: task3 } = createTask();
        const { task: task4 } = createTask();
        queue.enqueue(task1);
        queue.enqueue(task2);
        queue.enqueue(task3);
        queue.enqueue(task4);

        await setTimeout(WAIT_TIME);

        expect(task3).not.toHaveBeenCalled();
        expect(task4).not.toHaveBeenCalled();
    });

    it('should execute the next task as soon as the second task has resolved', async () => {
        const queue = new DynamiqueBatchedPromiseQueue(2);
        const { task: task1 } = createTask();
        const { task: task2, resolve: resolve2 } = createTask();
        const { task: task3 } = createTask();
        const { task: task4 } = createTask();
        queue.enqueue(task1);
        queue.enqueue(task2);
        queue.enqueue(task3);
        queue.enqueue(task4);

        resolve2(1);

        await setTimeout(WAIT_TIME);

        expect(task3).toHaveBeenCalled();
        expect(task4).not.toHaveBeenCalled();
    });

    it('should execute a new task if the second task has resolved', async () => {
        const queue = new DynamiqueBatchedPromiseQueue(2);
        const { task: task1 } = createTask();
        const { task: task2, resolve: resolve2 } = createTask();
        const { task: task3 } = createTask();
        queue.enqueue(task1);
        queue.enqueue(task2);

        resolve2(1);
        await setTimeout(WAIT_TIME);

        queue.enqueue(task3);

        await setTimeout(WAIT_TIME);
        expect(task3).toHaveBeenCalled();
    });
});

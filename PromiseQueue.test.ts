import { describe, expect, it } from 'vitest';
import { setTimeout } from 'timers/promises';
import { createTestTask } from './createTestTask';
import { WAIT_TIME } from './test-constants';
import { PromiseQueue } from './PromiseQueue';

describe('PromiseQueue', () => {
    describe('with 1 promise', () => {
        it('should return a promise', async () => {
            const queue = new PromiseQueue();
            const { task } = createTestTask();

            const result = queue.enqueue(task);

            expect(result).toBeInstanceOf(Promise);
        });

        it('should eventually execute the first task', async () => {
            const queue = new PromiseQueue();
            const { task } = createTestTask();

            queue.enqueue(task);

            await setTimeout(WAIT_TIME);

            expect(task).toHaveBeenCalled();
        });

        it('should resolve the returned promise if the task is resolved', async () => {
            const queue = new PromiseQueue();
            const { task, resolve } = createTestTask();

            const result = queue.enqueue(task);

            resolve(42);

            await expect(result).resolves.toBe(42);
        });
    });

    describe('with 2 promises', () => {
        it('should not execute the second task, if the first is not resolved', async () => {
            const queue = new PromiseQueue();
            const { task: task1 } = createTestTask();
            const { task: task2 } = createTestTask();
            queue.enqueue(task1);
            await setTimeout(WAIT_TIME);

            queue.enqueue(task2);

            expect(task2).not.toHaveBeenCalled();
        });

        it('should execute the second task, if the first is resolved', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve } = createTestTask();
            const { task: task2 } = createTestTask();
            queue.enqueue(task1);
            queue.enqueue(task2);

            resolve(42);
            await setTimeout(WAIT_TIME);

            expect(task2).toHaveBeenCalled();
        });

        it('should resolve the 2nd returns if it resolves', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve: resolve1 } = createTestTask();
            const { task: task2, resolve: resolve2 } = createTestTask();
            queue.enqueue(task1);
            const result2 = queue.enqueue(task2);

            resolve1(42);
            await setTimeout(WAIT_TIME);
            resolve2(43);

            await expect(result2).resolves.toBe(43);
        });

        it('should eventually execute the second task if the first is resolved before queuing', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve } = createTestTask();
            const { task: task2 } = createTestTask();
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
            const { task: task1, resolve } = createTestTask();
            const { task: task2 } = createTestTask();
            const { task: task3 } = createTestTask();
            queue.enqueue(task1);
            queue.enqueue(task2);
            queue.enqueue(task3);

            resolve(42);
            await setTimeout(WAIT_TIME);

            expect(task3).not.toHaveBeenCalled();
        });

        it('should execute the third task, if the second is resolved', async () => {
            const queue = new PromiseQueue();
            const { task: task1, resolve: resolve1 } = createTestTask();
            const { task: task2, resolve: resolve2 } = createTestTask();
            const { task: task3 } = createTestTask();
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
            const { task: task1, resolve } = createTestTask();
            const { task: task2 } = createTestTask();
            const { task: task3 } = createTestTask();
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

import { describe, expect, it, vi } from 'vitest';
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

        it('should reject the returned promise if the task is rejected', async () => {
            const queue = new PromiseQueue();
            const { task, reject } = createTestTask();

            const result = queue.enqueue(task);

            reject(42);

            await expect(result).rejects.toBe(42);
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

        it('should execute the second task, if the first is rejected', async () => {
            const queue = new PromiseQueue();
            const { task: task1, reject } = createTestTask();
            const { task: task2 } = createTestTask();
            queue.enqueue(task1).catch(() => {});
            queue.enqueue(task2);

            reject(42);
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

    describe('waitIdle', () => {
        it('should resolve if nothing is unqueued', async () => {
            const queue = new PromiseQueue();

            await expect(queue.waitIdle()).resolves.toBeUndefined();
        });

        it('should not resolve if a task has not resolved', async () => {
            const spy = vi.fn();
            const queue = new PromiseQueue();
            const { task: task1 } = createTestTask();
            queue.enqueue(task1);

            queue.waitIdle().then(spy);

            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });

        it('should resolve if a task has resolved', async () => {
            const spy = vi.fn();
            const queue = new PromiseQueue();
            const { task: task1, resolve } = createTestTask();
            queue.enqueue(task1);

            queue.waitIdle().then(spy);
            resolve(42);
            await setTimeout(WAIT_TIME);

            expect(spy).toHaveBeenCalled();
        });

        it('should not resolve if a later enqueued task has not resolved', async () => {
            const spy = vi.fn();
            const queue = new PromiseQueue();
            const { task: task1, resolve } = createTestTask();
            const { task: task2 } = createTestTask();
            queue.enqueue(task1);
            await setTimeout(WAIT_TIME);

            queue.waitIdle().then(spy);
            queue.enqueue(task2);
            resolve(42);
            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });

        it('should not resolve as well with a third task', async () => {
            const spy = vi.fn();
            const queue = new PromiseQueue();
            const { task: task1, resolve: resolve1 } = createTestTask();
            const { task: task2, resolve: resolve2 } = createTestTask();
            const { task: task3 } = createTestTask();
            queue.enqueue(task1);
            await setTimeout(WAIT_TIME);
            queue.waitIdle().then(spy);
            queue.enqueue(task2);
            resolve1(42);
            await setTimeout(WAIT_TIME);

            queue.enqueue(task3);
            resolve2(42);
            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });

        it('should resolve once all task have resolved', async () => {
            const spy = vi.fn();
            const queue = new PromiseQueue();
            const { task: task1, resolve: resolve1 } = createTestTask();
            const { task: task2, resolve: resolve2 } = createTestTask();
            const { task: task3, resolve: resolve3 } = createTestTask();
            queue.enqueue(task1);
            await setTimeout(WAIT_TIME);
            queue.waitIdle().then(spy);
            queue.enqueue(task2);
            resolve1(42);
            await setTimeout(WAIT_TIME);

            queue.enqueue(task3);
            resolve2(42);
            await setTimeout(WAIT_TIME);
            resolve3(42);
            await setTimeout(WAIT_TIME);

            expect(spy).toHaveBeenCalled();
        });
    });
});

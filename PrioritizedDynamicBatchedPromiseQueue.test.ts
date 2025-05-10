import { describe, expect, it, vi } from 'vitest';
import { setTimeout } from 'timers/promises';
import { createTestTask } from './createTestTask';
import { WAIT_TIME } from './test-constants';
import { PrioritizedDynamicBatchedPromiseQueue } from './PrioritizedDynamicBatchedPromiseQueue';
import { range } from './range';

describe('PrioritizedDynamicBatchedPromiseQueue', () => {
    it('should execute all tasks if number is under batch size', async () => {
        const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
        const { task: task1 } = createTestTask();
        const { task: task2 } = createTestTask();
        queue.enqueue(task1);
        queue.enqueue(task2);

        await setTimeout(WAIT_TIME);

        expect(task1).toHaveBeenCalled();
        expect(task2).toHaveBeenCalled();
    });

    it('should execute a second task even if a first has reject', async () => {
        const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
        const { task: task1, reject } = createTestTask();
        const { task: task2 } = createTestTask();
        queue.enqueue(task1).catch(() => {});

        reject();
        await setTimeout(WAIT_TIME);

        queue.enqueue(task2);
        await setTimeout(WAIT_TIME);

        expect(task2).toHaveBeenCalled();
    });

    it('should not execute next tasks if first batch has not resolved', async () => {
        const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
        const { task: task1 } = createTestTask();
        const { task: task2 } = createTestTask();
        const { task: task3 } = createTestTask();
        const { task: task4 } = createTestTask();
        queue.enqueue(task1);
        queue.enqueue(task2);
        queue.enqueue(task3);
        queue.enqueue(task4);

        await setTimeout(WAIT_TIME);

        expect(task3).not.toHaveBeenCalled();
        expect(task4).not.toHaveBeenCalled();
    });

    it('should execute the next task as soon as the any initial task has resolved', async () => {
        const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
        const { task: task1 } = createTestTask();
        const { task: task2, resolve: resolve2 } = createTestTask();
        const { task: task3 } = createTestTask();
        const { task: task4 } = createTestTask();
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
        const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
        const { task: task1 } = createTestTask();
        const { task: task2, resolve: resolve2 } = createTestTask();
        const { task: task3 } = createTestTask();
        queue.enqueue(task1);
        queue.enqueue(task2);

        resolve2(1);
        await setTimeout(WAIT_TIME);

        queue.enqueue(task3);

        await setTimeout(WAIT_TIME);
        expect(task3).toHaveBeenCalled();
    });

    describe('prioritize', () => {
        it('should first execute prioritized task if specified', async () => {
            const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
            const { task: task1 } = createTestTask();
            const { task: task2 } = createTestTask();
            const { task: task3 } = createTestTask();

            queue.enqueue(task1);
            queue.enqueue(task2);
            queue.enqueue(task3, true);

            await setTimeout(WAIT_TIME);
            expect(task3).toHaveBeenCalled();
            expect(task1).toHaveBeenCalled();
            expect(task2).not.toHaveBeenCalled();
        });

        it('should first execute all prioritized tasks before normal tasks', async () => {
            const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
            const { task: task1 } = createTestTask();
            const { task: task2, resolve } = createTestTask();
            const { task: task3 } = createTestTask();

            queue.enqueue(task1);
            queue.enqueue(task2, true);
            queue.enqueue(task1);
            queue.enqueue(task2, true);
            queue.enqueue(task3, true);

            await setTimeout(WAIT_TIME);
            expect(task2).toHaveBeenCalledTimes(2);
            expect(task3).not.toHaveBeenCalledOnce();
            expect(task1).not.toHaveBeenCalled();

            queue.enqueue(task3, true);
            resolve(42);
            await setTimeout(WAIT_TIME);
            expect(task3).toHaveBeenCalledTimes(2);
            expect(task1).not.toHaveBeenCalled();
        });
    });

    describe('waitIdle', () => {
        it('should resolve if nothing is unqueued', async () => {
            const queue = new PrioritizedDynamicBatchedPromiseQueue(2);

            await expect(queue.waitIdle()).resolves.toBeUndefined();
        });

        it('should not resolve if a task has not resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
            const { task } = createTestTask();
            queue.enqueue(task);

            queue.waitIdle().then(spy);
            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });

        it('should not resolve if the batch has not resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
            const { task } = createTestTask();
            queue.enqueue(task);
            queue.enqueue(task);

            queue.waitIdle().then(spy);

            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });

        it('should resolve if a task has resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
            const { task, resolve } = createTestTask();
            queue.enqueue(task);

            queue.waitIdle().then(spy);
            resolve(42);
            await setTimeout(WAIT_TIME);

            expect(spy).toHaveBeenCalled();
        });

        it('should not resolve if not all batch has not resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
            const { task: task1, resolve: resolve1 } = createTestTask();
            const { task: task2 } = createTestTask();
            queue.enqueue(task1);
            queue.enqueue(task2);
            queue.waitIdle().then(spy);

            resolve1(42);
            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });

        it('should not resolve if a task is added before first is resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedDynamicBatchedPromiseQueue(2);
            const { task: task1, resolve: resolve1 } = createTestTask();
            const { task: task2 } = createTestTask();
            queue.enqueue(task1);
            queue.waitIdle().then(spy);
            await setTimeout(WAIT_TIME);

            queue.enqueue(task2);
            resolve1(42);
            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('scaling', () => {
        it('should handle many tasks', async () => {
            const queue = new PrioritizedDynamicBatchedPromiseQueue(20);
            const { task: task1, resolve: resolve1 } = createTestTask();
            const { task: task2, resolve: resolve2 } = createTestTask();
            const { task: task3 } = createTestTask();

            range(30).forEach(() => {
                queue.enqueue(task1);
            });
            range(10).forEach(() => {
                queue.enqueue(task2);
            });
            range(20).forEach(() => {
                queue.enqueue(task3);
            });

            await setTimeout(WAIT_TIME);

            expect(task1).toHaveBeenCalledTimes(20);
            expect(task2).not.toHaveBeenCalled();
            expect(task3).not.toHaveBeenCalled();

            resolve1(1);
            await setTimeout(WAIT_TIME);

            expect(task1).toHaveBeenCalledTimes(30);
            expect(task2).toHaveBeenCalledTimes(10);
            expect(task3).toHaveBeenCalledTimes(10);

            resolve2(2);
            await setTimeout(WAIT_TIME);

            expect(task3).toHaveBeenCalledTimes(20);
        });
    });
});

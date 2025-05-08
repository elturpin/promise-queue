import { describe, expect, it, vi } from 'vitest';
import { setTimeout } from 'timers/promises';
import { createTestTask } from './createTestTask';
import { WAIT_TIME } from './test-constants';
import { PrioritizedPromiseQueue } from './PrioritizedPromiseQueue';

describe('PrioritizedPromiseQueue', () => {
    it('should enqueue tasks as PromiseQueue', async () => {
        const queue = new PrioritizedPromiseQueue();
        const { task: task1, resolve: resolve1 } = createTestTask();
        const { task: task2, resolve: resolve2 } = createTestTask();

        const pResult1 = queue.enqueue(task1);
        const pResult2 = queue.enqueue(task2);

        await setTimeout(WAIT_TIME);
        expect(task1).toHaveBeenCalled();
        expect(task2).not.toHaveBeenCalled();

        resolve1(42);
        await expect(pResult1).resolves.toBe(42);
        expect(task2).toHaveBeenCalled();

        resolve2(43);
        await expect(pResult2).resolves.toBe(43);
    });

    it('should first execute prioritized task if specified', async () => {
        const queue = new PrioritizedPromiseQueue();
        const { task: task1 } = createTestTask();
        const { task: task2 } = createTestTask();
        const { task: task3 } = createTestTask();

        queue.enqueue(task1);
        queue.enqueue(task2);
        queue.enqueue(task3, true);

        await setTimeout(WAIT_TIME);
        expect(task3).toHaveBeenCalled();
        expect(task2).not.toHaveBeenCalled();
        expect(task1).not.toHaveBeenCalled();
    });

    it('should first execute all prioritized tasks before normal tasks', async () => {
        const queue = new PrioritizedPromiseQueue();
        const { task: task1 } = createTestTask();
        const { task: task2, resolve } = createTestTask();
        const { task: task3 } = createTestTask();

        queue.enqueue(task1);
        queue.enqueue(task2, true);
        queue.enqueue(task3, true);

        await setTimeout(WAIT_TIME);
        expect(task2).toHaveBeenCalled();

        resolve(42);
        await setTimeout(WAIT_TIME);
        expect(task3).toHaveBeenCalled();
        expect(task1).not.toHaveBeenCalled();
    });

    it('should execute a newly queued prioritized task before normal', async () => {
        const queue = new PrioritizedPromiseQueue();
        const { task: task1 } = createTestTask();
        const { task: task2, resolve } = createTestTask();
        const { task: task3 } = createTestTask();

        queue.enqueue(task1);
        queue.enqueue(task2, true);
        await setTimeout(WAIT_TIME);
        expect(task2).toHaveBeenCalled();
        expect(task1).not.toHaveBeenCalled();

        queue.enqueue(task3, true);
        resolve(42);

        await setTimeout(WAIT_TIME);
        expect(task3).toHaveBeenCalled();
        expect(task1).not.toHaveBeenCalled();
    });

    describe('waitIdle', () => {
        it('should resolve if nothing is unqueued', async () => {
            const queue = new PrioritizedPromiseQueue();

            await expect(queue.waitIdle()).resolves.toBeUndefined();
        });

        it('should not resolve if a task has not resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedPromiseQueue();
            const { task: task1 } = createTestTask();
            queue.enqueue(task1);

            queue.waitIdle().then(spy);

            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });

        it('should not resolve if a prior task has not resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedPromiseQueue();
            const { task: task1 } = createTestTask();
            queue.enqueue(task1, true);

            queue.waitIdle().then(spy);

            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });

        it('should resolve if a task has resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedPromiseQueue();
            const { task: task1, resolve } = createTestTask();
            queue.enqueue(task1);

            queue.waitIdle().then(spy);
            resolve(42);
            await setTimeout(WAIT_TIME);

            expect(spy).toHaveBeenCalled();
        });

        it('should not resolve if a later enqueued task has not resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedPromiseQueue();
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
            const queue = new PrioritizedPromiseQueue();
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

        it('should not resolve if prior task is added and then a normal', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedPromiseQueue();
            const { task: task1, resolve: resolve1 } = createTestTask();
            const { task: task2, resolve: resolve2 } = createTestTask();
            const { task: task3 } = createTestTask();
            queue.enqueue(task1);
            await setTimeout(WAIT_TIME);
            queue.waitIdle().then(spy);
            queue.enqueue(task2, true);
            resolve1(42);
            await setTimeout(WAIT_TIME);
            queue.enqueue(task3);
            resolve2(2);
            await setTimeout(WAIT_TIME);

            expect(spy).not.toHaveBeenCalled();
        });

        it('should resolve once all task have resolved', async () => {
            const spy = vi.fn();
            const queue = new PrioritizedPromiseQueue();
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

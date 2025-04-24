import { describe, expect, it } from 'vitest';
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
});

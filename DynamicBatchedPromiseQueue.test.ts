import { describe, expect, it } from 'vitest';
import { setTimeout } from 'timers/promises';
import { createTestTask } from './createTestTask';
import { WAIT_TIME } from './test-constants';
import { DynamicBatchedPromiseQueue } from './DynamicBatchedPromiseQueue';

describe('DynamicBatchedPromiseQueue', () => {
    it('should execute all tasks if number is under batch size', async () => {
        const queue = new DynamicBatchedPromiseQueue(2);
        const { task: task1 } = createTestTask();
        const { task: task2 } = createTestTask();
        queue.enqueue(task1);
        queue.enqueue(task2);

        await setTimeout(WAIT_TIME);

        expect(task1).toHaveBeenCalled();
        expect(task2).toHaveBeenCalled();
    });

    it('should execute a second task even if a first has reject', async () => {
        const queue = new DynamicBatchedPromiseQueue(2);
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
        const queue = new DynamicBatchedPromiseQueue(2);
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
        const queue = new DynamicBatchedPromiseQueue(2);
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
        const queue = new DynamicBatchedPromiseQueue(2);
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
});

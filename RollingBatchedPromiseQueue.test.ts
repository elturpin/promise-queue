import { describe, expect, it } from 'vitest';
import { setTimeout } from 'timers/promises';
import { createTestTask } from './createTestTask';
import { WAIT_TIME } from './test-constants';
import { RollingBatchedPromiseQueue } from './RollingBatchedPromiseQueue';

describe('RollingBatchedPromiseQueue', () => {
    it('should eventually execute all tasks if number is under batch size', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
        const { task: task1 } = createTestTask();
        const { task: task2 } = createTestTask();

        queue.enqueue(task1);
        queue.enqueue(task2);
        await setTimeout(WAIT_TIME);

        expect(task1).toHaveBeenCalled();
        expect(task2).toHaveBeenCalled();
    });

    it('should note execute the next batch if the first is not resolved', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
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

    it('should execute the next batch if the first is resolved', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
        const { task: task1, resolve: resolve1 } = createTestTask();
        const { task: task2, resolve: resolve2 } = createTestTask();
        const { task: task3 } = createTestTask();
        const { task: task4 } = createTestTask();
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

    it('should execute the next batch if the first is rejected', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
        const { task: task1, reject: reject1 } = createTestTask();
        const { task: task2, reject: reject2 } = createTestTask();
        const { task: task3 } = createTestTask();
        const { task: task4 } = createTestTask();
        queue.enqueue(task1).catch(() => {});
        queue.enqueue(task2).catch(() => {});
        queue.enqueue(task3);
        queue.enqueue(task4);

        reject1(1);
        reject2(2);
        await setTimeout(WAIT_TIME);

        expect(task3).toHaveBeenCalled();
        expect(task4).toHaveBeenCalled();
    });

    it('should execute the third task only if the first task is resolved', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
        const { task: task1, resolve: resolve1 } = createTestTask();
        const { task: task2 } = createTestTask();
        const { task: task3 } = createTestTask();
        const { task: task4 } = createTestTask();
        queue.enqueue(task1);
        queue.enqueue(task2);
        queue.enqueue(task3);
        queue.enqueue(task4);

        resolve1(1);
        await setTimeout(WAIT_TIME);

        expect(task3).toHaveBeenCalled();
        expect(task4).not.toHaveBeenCalled();
    });

    it('should execute the forth task only if the second task is resolved', async () => {
        const queue = new RollingBatchedPromiseQueue(2);
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

        expect(task3).not.toHaveBeenCalled();
        expect(task4).toHaveBeenCalled();
    });
});

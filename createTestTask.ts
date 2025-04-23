import { vi } from 'vitest';

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

export function createTestTask() {
    const { promise, resolve, reject } = deferPromise<number>();

    const task = vi.fn(() => promise);

    return { task, resolve, reject };
}

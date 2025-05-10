# TDD - Manage to frame correctly your tests
For the scope of this dev, a task is defined as a function that will return a Promise and will be called later.

The use of `createTestTask` allow to create such a task with:
+ a spy function that return a promise, to check if the task is executed in tests.
+ a deferred Promise, that allow you to control exactly when a promise resolves, allowing to wait time in tests as you want.

# Step by step with an easy beginning
+ The first problem to be solved was juste a single queue that juste chained the promises, no more.
+ Then we try to batch the promises with a naive approche to *schedule* the tasks
+ Then, and only then, we try to use the *dynamic scheduling* of the tasks

What about the priority, and the idle state ? It was for later. First resolve the easy steps, learn things and then go harder.

# Some learnings
+ To return a wrapped promise from an async function (some kind of a `Promise<Promise<T>>`), instead of using a `let` variable and assign it inside the async function, one can return a getter that return the promise:

```ts
// instead of that
function doSomething() {
    let result: Promise<any>;

    const later = new Promise(async (resolve) => {
        await someWork();
        result = asyncCallback()
        resolve()
    })
    
    return later.then(() => result);
}

// do this
function doSomething() {
    const later = new Promise(async (resolve) => {
        await someWork();
        resolve(() => asyncCallback())
    })
    
    return later.then((getResult) => getResult());
}
```
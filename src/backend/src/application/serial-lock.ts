/**
 * Runs async tasks one at a time, in arrival order. Guards read-modify-write
 * sequences (charging an order, issuing a pickup code) against a double tap
 * or two buffet screens acting at once. One process, so in-memory is enough.
 */
export class SerialLock {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task, task);
    // Keep the chain alive whether the task succeeds or fails.
    this.tail = result.catch(() => undefined);
    return result;
  }
}

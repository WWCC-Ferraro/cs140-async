// Waiting, giving up, and trying again — without holding the thread.
//
// Everything here uses the host's timers (setTimeout, clearTimeout). In Node,
// a timer that is still pending keeps the program alive until it fires.

/**
 * Makes the error withTimeout rejects with. Given to you — use it.
 *   timeoutError(50).name     →  'TimeoutError'
 *   timeoutError(50).message  →  'timed out after 50 ms'
 */
export function timeoutError(ms) {
  const err = new Error(`timed out after ${ms} ms`);
  err.name = 'TimeoutError';
  return err;
}

/**
 * Task 4. Return a promise that fulfils (with undefined) after `ms`
 * milliseconds.
 *
 * It must not hold the thread while it waits: code queued meanwhile — a timer,
 * a promise callback, another request's answer — runs during the wait.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function delay(ms) {
  throw new Error('not implemented');
}

/**
 * Task 5. Give `promise` a time limit.
 *
 * - `promise` settles within `ms` → the returned promise settles the same way,
 *   with the same value or the same error.
 * - It has not settled after `ms` → reject with timeoutError(ms).
 *
 * Whichever happens first, leave no timer pending behind you.
 *
 * @param {Promise<any>} promise
 * @param {number} ms
 * @returns {Promise<any>}
 */
export function withTimeout(promise, ms) {
  throw new Error('not implemented');
}

/**
 * Task 6. Run `task`, and if it fails, wait and run it again.
 *
 * `task` is a function that returns a promise — the work to try. Call it. If
 * the promise fulfils, fulfil with its value. If it rejects, wait `delayMs`
 * (use delay from Task 4) and call `task` again — at most `attempts` calls in
 * all. If every attempt rejects, reject with the LAST error. Do not wait after
 * the last attempt.
 *
 * @param {() => Promise<any>} task
 * @param {{ attempts?: number, delayMs?: number }} [options]
 * @returns {Promise<any>}
 */
export async function retry(task, { attempts = 3, delayMs = 100 } = {}) {
  throw new Error('not implemented');
}

// Task 6 — retry: try again, later, without holding the thread.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retry } from '../src/timing.js';

// A task that fails `failures` times, then fulfils with 'ok'. Records each call.
function flaky(failures) {
  const task = () => {
    task.calls.push(Date.now());
    const n = task.calls.length;
    return n <= failures ? Promise.reject(new Error(`fail ${n}`)) : Promise.resolve('ok');
  };
  task.calls = [];
  return task;
}

test('a task that works first time is called once', async () => {
  const task = flaky(0);
  const value = await retry(task, { attempts: 3, delayMs: 10 });
  assert.equal(value, 'ok', `Expected 'ok', got ${JSON.stringify(value)}.`);
  assert.equal(task.calls.length, 1, `The task was called ${task.calls.length} times. It worked the first time.`);
});

test('a task that fails twice, then works, fulfils on the third call', async () => {
  const task = flaky(2);
  let value;
  try {
    value = await retry(task, { attempts: 3, delayMs: 10 });
  } catch (err) {
    assert.fail(`retry rejected with "${err.message}" after ${task.calls.length} call(s) of the task. ` +
      (task.calls.length === 1
        ? 'A promise settles once: waiting on the same rejected promise again cannot give a different answer. Trying again means calling the task again.'
        : 'Your try/catch has to see each rejection — does the try await the task\'s promise?'));
  }
  assert.equal(value, 'ok');
  assert.equal(task.calls.length, 3, `Expected 3 calls, got ${task.calls.length}.`);
});

test('when every attempt fails, rejects with the last error', async () => {
  const task = flaky(10);
  await assert.rejects(retry(task, { attempts: 3, delayMs: 10 }), err => {
    assert.equal(err.message, 'fail 3', `Expected the last error ("fail 3"), got "${err.message}".`);
    return true;
  }, 'Every attempt failed, but retry fulfilled.');
  assert.equal(task.calls.length, 3, `attempts: 3 should mean 3 calls in all, and there were ${task.calls.length}.`);
});

test('attempts: 1 means no second try', async () => {
  const task = flaky(10);
  await assert.rejects(retry(task, { attempts: 1, delayMs: 10 }), /fail 1/);
  assert.equal(task.calls.length, 1, `Expected 1 call, got ${task.calls.length}.`);
});

test('waits delayMs between attempts', async () => {
  const task = flaky(2);
  await retry(task, { attempts: 3, delayMs: 25 }).catch(() => {});
  const gaps = task.calls.slice(1).map((t, i) => t - task.calls[i]);
  assert.equal(gaps.length, 2, `Expected 3 calls, got ${task.calls.length}.`);
  assert.ok(gaps.every(gap => gap >= 23),
    `The gaps between calls were ${gaps.join(' ms and ')} ms; each should be about 25. Wait before trying again.`);
});

test('does not hold the thread while it waits', async () => {
  const task = flaky(1);
  const log = [];
  const wrapped = () => { log.push(`attempt ${task.calls.length + 1}`); return task(); };
  const p = retry(wrapped, { attempts: 2, delayMs: 40 });
  setTimeout(() => log.push('a 5 ms timer ran'), 5);
  await p;
  assert.deepEqual(log, ['attempt 1', 'a 5 ms timer ran', 'attempt 2'],
    `Order of events: ${log.join(' → ')}. A 5 ms timer should run during the 40 ms wait between attempts. ` +
    'If it ran last, the wait held the only thread. (The event loop, slowly: "Blocking the only thread")');
});

test('does not wait after the last attempt', async () => {
  const task = flaky(10);
  const start = Date.now();
  await retry(task, { attempts: 2, delayMs: 80 }).catch(() => {});
  const took = Date.now() - start;
  assert.equal(task.calls.length, 2, `Expected 2 calls, got ${task.calls.length}.`);
  assert.ok(took < 140,
    `Two attempts with an 80 ms wait between them took ${took} ms. There is one wait between two attempts, not one after each.`);
});

// Task 5 — withTimeout: a time limit that cleans up after itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from '../src/timing.js';

// Node only: how many timers the host is holding right now. A pending timer
// keeps a Node program alive (The same code in another host, "Timers").
const pendingTimers = () => process.getActiveResourcesInfo().filter(r => r === 'Timeout').length;

const after = (ms, value) => new Promise(resolve => setTimeout(() => resolve(value), ms));
const failAfter = (ms, message) => new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

test('leaves no timer pending when the promise fulfils first', async () => {
  const before = pendingTimers();
  await withTimeout(Promise.resolve('fast'), 10_000);
  assert.equal(pendingTimers(), before,
    'The promise fulfilled at once, but a 10-second timer is still pending. In Node that keeps a script alive for 10 seconds after its work is done. ' +
    'When the promise wins, cancel the timer you started.');
});

test('leaves no timer pending when the promise rejects first', async () => {
  const before = pendingTimers();
  await withTimeout(Promise.reject(new Error('no')), 10_000).catch(() => {});
  assert.equal(pendingTimers(), before,
    'The promise rejected at once, but the timer is still pending. A rejection is a way of finishing first too.');
});

test('fulfils with the value when the promise is in time', async () => {
  const value = await withTimeout(after(10, 'on time'), 100);
  assert.equal(value, 'on time', `Expected 'on time', got ${JSON.stringify(value)}.`);
});

test('rejects with the same error when the promise rejects in time', async () => {
  await assert.rejects(withTimeout(failAfter(10, 'server said no'), 100), err => {
    assert.equal(err.message, 'server said no',
      `Expected the promise's own error, got "${err.message}". A failure that arrives in time is not a timeout.`);
    return true;
  }, 'The promise rejected in time, but withTimeout fulfilled.');
});

test('rejects with a TimeoutError when the promise is too slow', async () => {
  await assert.rejects(withTimeout(after(150, 'too slow'), 30), err => {
    assert.equal(err.name, 'TimeoutError', `Expected an error named TimeoutError, got ${err.name}: "${err.message}". Use timeoutError(ms).`);
    assert.equal(err.message, 'timed out after 30 ms');
    return true;
  }, 'The promise took 150 ms and the limit was 30, but withTimeout fulfilled.');
});

test('gives up at the limit, without waiting for the slow promise', async () => {
  const start = Date.now();
  await withTimeout(after(150, 'too slow'), 30).catch(() => {});
  const waited = Date.now() - start;
  assert.ok(waited < 120,
    `withTimeout took ${waited} ms with a 30 ms limit. It waited for the slow promise instead of settling when the timer fired.`);
});

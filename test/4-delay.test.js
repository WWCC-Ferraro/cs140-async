// Task 4 — delay: wait without holding the thread.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { delay } from '../src/timing.js';

test('returns a pending promise straight away', async () => {
  const p = delay(20);
  assert.ok(p && typeof p.then === 'function', `delay should return a promise, and it returned ${p === undefined ? 'undefined' : typeof p}.`);
  let settled = false;
  p.then(() => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false,
    'The promise had already fulfilled before any time passed. It should stay pending until the host calls you back.');
  await p;
});

test('fulfils once at least ms have passed', async () => {
  const start = Date.now();
  await delay(30);
  const waited = Date.now() - start;
  assert.ok(waited >= 28, `delay(30) fulfilled after ${waited} ms. It should wait about 30.`);
});

test('does not hold the thread while it waits', async () => {
  const log = [];
  setTimeout(() => log.push('a 5 ms timer ran'), 5);
  const p = delay(40);
  log.push('delay returned');
  await p;
  log.push('delay fulfilled');
  assert.deepEqual(log, ['delay returned', 'a 5 ms timer ran', 'delay fulfilled'],
    `Order of events: ${log.join(' → ')}. A 5 ms timer could not run during a 40 ms delay, so the delay held the only thread. ` +
    'Waiting has to be done by the host, not by a loop in your code. (The event loop, slowly: "Blocking the only thread")');
});

// Task 7 — loadShelf: show what loaded, list what did not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadShelf } from '../src/client.js';
import { fakeTransport } from '../src/fake-transport.js';

const routes = {
  '/books/1': { body: { id: 1, title: 'Kindred' }, ms: 10 },
  '/books/2': { body: { id: 2, title: 'Dawn' }, ms: 5 },
  '/books/3': { body: { id: 3, title: 'Wild Seed' }, ms: 15 },
  // /books/4 has no route: 404
  '/books/5': { fail: 'network down', ms: 5 },
  '/books/9': { body: { id: 9, title: 'Very Slow' }, ms: 150 },
};

async function shelf(transport, ids, options) {
  try {
    return await loadShelf(transport, ids, options);
  } catch (err) {
    assert.fail(`loadShelf rejected with "${err.message}". One book failing should leave a gap on the shelf, not take the whole page down. ` +
      'Which way of waiting for several promises lets you see every outcome?');
  }
}

test('when every book loads, all are on the shelf in ids order and none is missing', async () => {
  const result = await shelf(fakeTransport(routes), [3, 1, 2], { timeoutMs: 100 });
  assert.deepEqual(result.books.map(b => b.id), [3, 1, 2],
    `Got books ${JSON.stringify(result.books.map(b => b.id))}. They should follow the ids, not the order the answers arrived.`);
  assert.deepEqual(result.missing, []);
});

test('a 404 and a network failure are listed as missing; the rest still load', async () => {
  const result = await shelf(fakeTransport(routes), [1, 4, 2, 5], { timeoutMs: 100 });
  assert.deepEqual(result.books.map(b => b.id), [1, 2],
    `Expected books 1 and 2, got ${JSON.stringify(result.books.map(b => b.id))}.`);
  assert.deepEqual(result.missing, [4, 5],
    `Expected ids 4 and 5 to be missing, got ${JSON.stringify(result.missing)}. Missing holds ids, in the order they were given.`);
});

test('a book slower than timeoutMs is missing, and the shelf does not wait for it', async () => {
  const transport = fakeTransport(routes);
  const result = await shelf(transport, [1, 9], { timeoutMs: 40 });
  assert.deepEqual(result.missing, [9], `Expected the slow book (9) to be missing, got ${JSON.stringify(result.missing)}.`);
  assert.deepEqual(result.books.map(b => b.id), [1]);
  assert.ok(!transport.log.includes('end /books/9'),
    'The shelf waited for the slow book to answer (150 ms) although the limit was 40 ms. Each request needs its own time limit — Task 5.');
});

test('requests every book before any has answered', async () => {
  const transport = fakeTransport(routes);
  await shelf(transport, [1, 2, 3], { timeoutMs: 100 });
  assert.deepEqual(transport.log.slice(0, 3), ['start /books/1', 'start /books/2', 'start /books/3'],
    `The transport saw: ${transport.log.join(', ')}. These requests do not depend on each other — start them all, then wait.`);
});

test('no ids gives an empty shelf', async () => {
  const result = await shelf(fakeTransport(routes), [], { timeoutMs: 100 });
  assert.deepEqual(result, { books: [], missing: [] }, `Expected { books: [], missing: [] }, got ${JSON.stringify(result)}.`);
});

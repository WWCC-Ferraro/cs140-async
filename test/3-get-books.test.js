// Task 3 — getBooks: start them all, then wait.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBooks } from '../src/client.js';
import { fakeTransport } from '../src/fake-transport.js';

// Slowest first, so the answers arrive in the opposite order to the requests.
const routes = {
  '/books/1': { body: { id: 1, title: 'Kindred' }, ms: 30 },
  '/books/2': { body: { id: 2, title: 'Dawn' }, ms: 20 },
  '/books/3': { body: { id: 3, title: 'Wild Seed' }, ms: 10 },
  '/books/4': { status: 500, body: {}, ms: 15 },
};

test('fulfils with every book, in the order the ids were given', async () => {
  const result = await getBooks(fakeTransport(routes), [1, 2, 3]);
  assert.ok(Array.isArray(result), `Expected an array of books, got ${JSON.stringify(result)}.`);
  assert.deepEqual(result.map(book => book && book.id), [1, 2, 3],
    `Got the books with ids ${JSON.stringify(result.map(book => book && book.id))}. The answers arrive 3, 2, 1; the result should still follow the ids. ` +
    'If the array is empty or short, the function returned before the answers arrived.');
});

test('makes every request before any has answered', async () => {
  const transport = fakeTransport(routes);
  await getBooks(transport, [1, 2, 3]);
  assert.deepEqual(transport.log.slice(0, 3), ['start /books/1', 'start /books/2', 'start /books/3'],
    `The transport saw: ${transport.log.join(', ')}. Each request waited for the one before it, so three books take as long as all three added up. ` +
    'None of these needs another\'s result. (async and await, "Start them all, then wait")');
});

test('one failure rejects the whole call with that error', async () => {
  await assert.rejects(getBooks(fakeTransport(routes), [1, 4, 3]), err => {
    assert.equal(err.status, 500, `Expected the 500 error from /books/4, got "${err.message}".`);
    return true;
  }, 'getBooks fulfilled although /books/4 failed. Task 7 is where failures are kept apart; here one failure is the caller\'s to see.');
});

test('no ids gives an empty array', async () => {
  const transport = fakeTransport(routes);
  const result = await getBooks(transport, []);
  assert.deepEqual(result, [], `Expected [], got ${JSON.stringify(result)}.`);
  assert.deepEqual(transport.log, [], 'No ids should mean no requests.');
});

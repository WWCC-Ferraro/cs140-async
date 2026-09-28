// Task 2 — getBookWithAuthor: one step needs the last one's result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBookWithAuthor } from '../src/client.js';
import { fakeTransport } from '../src/fake-transport.js';

const routes = {
  '/books/1': { body: { id: 1, title: 'Kindred', authorId: 7 }, ms: 5 },
  '/books/2': { body: { id: 2, title: 'Lost Tales', authorId: 404 }, ms: 5 },
  '/books/3': { body: { id: 3, title: 'Offline', authorId: 8 }, ms: 5 },
  '/books/5': { body: { id: 5, title: 'Broken', authorId: 9 }, ms: 5 },
  '/authors/7': { body: { id: 7, name: 'Octavia E. Butler' }, ms: 5 },
  // /authors/404 has no route, so it answers 404
  '/authors/8': { fail: 'network down', ms: 5 },
  '/authors/9': { status: 500, body: { error: 'oops' }, ms: 5 },
};

test('fulfils with the title and the author\'s name', async () => {
  const result = await getBookWithAuthor(fakeTransport(routes), 1);
  assert.deepEqual(result, { title: 'Kindred', author: 'Octavia E. Butler' },
    'Expected { title, author } with the author\'s name. If a field is undefined, check that each lookup was awaited before its result was used.');
});

test('asks for the author only after the book has answered', async () => {
  const transport = fakeTransport(routes);
  await getBookWithAuthor(transport, 1);
  assert.deepEqual(transport.log, ['start /books/1', 'end /books/1', 'start /authors/7', 'end /authors/7'],
    `The requests happened in this order: ${transport.log.join(', ')}. The author's id comes from the book, so the second request can only start once the first has answered.`);
});

test('an author that answers 404 gives author: null, and the book still loads', async () => {
  let result;
  try {
    result = await getBookWithAuthor(fakeTransport(routes), 2);
  } catch (err) {
    assert.fail(`It rejected with "${err.message}". A try/catch sees a rejection only when the promise is awaited inside the try — look at what your try is actually waiting for. (async and await, "A try around an await catches the rejection")`);
  }
  assert.deepEqual(result, { title: 'Lost Tales', author: null });
});

test('an author lookup that fails for another reason rejects with that error', async () => {
  await assert.rejects(getBookWithAuthor(fakeTransport(routes), 5), err => {
    assert.equal(err.status, 500, `Expected the 500 error to come through, got ${JSON.stringify(err.message)}.`);
    return true;
  }, 'A 500 from the author lookup was turned into a value. Only a 404 means "no author"; any other failure is the caller\'s to handle.');
});

test('a network failure on the author rejects too', async () => {
  await assert.rejects(getBookWithAuthor(fakeTransport(routes), 3), /network down/,
    'A failed author lookup with no answer at all should reject. Your catch is handling more than the 404 case.');
});

test('a book that is not there rejects, and no author is requested', async () => {
  const transport = fakeTransport(routes);
  await assert.rejects(getBookWithAuthor(transport, 99), err => {
    assert.equal(err.status, 404, `Expected the book's 404 error, got "${err.message}".`);
    return true;
  }, 'A missing book should reject — there is nothing to show.');
  assert.deepEqual(transport.log.filter(line => line.includes('/authors/')), [],
    'An author was requested after the book lookup failed. Nothing after a failed await should run.');
});

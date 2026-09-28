// Task 1 — getJSON: a promise for the body, or a rejection that says why.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getJSON } from '../src/client.js';
import { fakeTransport } from '../src/fake-transport.js';

const books = {
  '/books/1': { body: { id: 1, title: 'Kindred', authorId: 7 }, ms: 5 },
  '/books/2': { status: 201, body: { id: 2, title: 'Dawn', authorId: 7 } },
  '/books/3': { status: 500, body: { error: 'database down' } },
  '/books/4': { fail: 'network down', ms: 5 },
};

// Calls getJSON and turns an immediate throw into a failed assertion with advice.
function call(transport, path) {
  let result;
  try {
    result = getJSON(transport, path);
  } catch (err) {
    assert.fail(`getJSON threw straight away ("${err.message}"). It should return a promise, and report every failure by rejecting it.`);
  }
  assert.ok(result && typeof result.then === 'function',
    `getJSON returned ${result === undefined ? 'undefined' : typeof result}, not a promise. ` +
    'The caller cannot wait for anything else. Does your function return the chain it builds? (Promises, "A surrounding try does not see a rejection")');
  return result;
}

test('returns a promise straight away, before the server has answered', () => {
  const transport = fakeTransport(books);
  const result = call(transport, '/books/1');
  result.catch(() => {});
  assert.deepEqual(transport.log, ['start /books/1'],
    'The request should be made during the call, and its answer should not have arrived yet.');
});

test('a 200 answer fulfils with the body', async () => {
  const body = await call(fakeTransport(books), '/books/1');
  assert.deepEqual(body, { id: 1, title: 'Kindred', authorId: 7 },
    'Expected the response body, not the whole response or undefined. What does your last .then link return?');
});

test('any status from 200 to 299 counts as success', async () => {
  const body = await call(fakeTransport(books), '/books/2').catch(err => err);
  assert.deepEqual(body, { id: 2, title: 'Dawn', authorId: 7 },
    `A 201 answer should fulfil with its body, and it came back as ${body instanceof Error ? `a rejection ("${body.message}")` : JSON.stringify(body)}. Check the range your status test accepts.`);
});

test('a 404 rejects with an error naming the path and the status', async () => {
  await assert.rejects(call(fakeTransport(books), '/books/99'), err => {
    assert.equal(err.message, 'GET /books/99 failed: 404',
      'The rejection should carry httpError(path, status). A 404 is an answer, so the transport fulfilled — your .then has to turn it into a failure.');
    assert.equal(err.status, 404, 'The error should have a .status of 404 — Task 2 depends on it.');
    return true;
  }, 'A 404 should make the promise reject. If it fulfilled, the status is not being checked.');
});

test('a 500 rejects too', async () => {
  await assert.rejects(call(fakeTransport(books), '/books/3'), err => {
    assert.equal(err.status, 500, `Expected an error with .status 500, got ${JSON.stringify(err.status)}.`);
    return true;
  }, 'A 500 should reject, like any status outside 200–299.');
});

test('when the transport rejects, getJSON rejects with that same error', async () => {
  await assert.rejects(call(fakeTransport(books), '/books/4'), err => {
    assert.equal(err.message, 'network down',
      `Expected the transport's own error ("network down"), got "${err.message}". Let a rejection travel down the chain untouched.`);
    return true;
  }, 'The network failure was swallowed: the promise fulfilled. Is a .catch turning the failure into a value?');
});

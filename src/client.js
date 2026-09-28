// A small client for a bookshop's API.
//
// Every function here takes a TRANSPORT as its first argument. A transport is
// a function: transport(path) returns a promise that
//   - fulfils with a response, { status, body }, whenever the server answered —
//     a 404 or a 500 is still an answer;
//   - rejects with an Error when there was no answer at all (the network is down).
//
// The tests hand you a fake one (src/fake-transport.js). Your code never needs
// to know it is fake.
//
// The API has two kinds of path:
//   /books/<id>     →  { id, title, authorId }
//   /authors/<id>   →  { id, name }

import { withTimeout } from './timing.js';

/**
 * Makes the error getJSON rejects with when the server answers with a status
 * outside 200–299. Given to you — use it.
 *   httpError('/books/9', 404).message  →  'GET /books/9 failed: 404'
 *   httpError('/books/9', 404).status   →  404
 */
export function httpError(path, status) {
  const err = new Error(`GET ${path} failed: ${status}`);
  err.status = status;
  return err;
}

/**
 * Task 1. Ask the transport for `path`, and return a promise for the body.
 *
 * - A status from 200 to 299 → the promise fulfils with response.body.
 * - Any other status        → it rejects with httpError(path, status).
 * - The transport rejects   → it rejects with that same error, untouched.
 *
 * Write it with .then — no async, no await.
 *
 * @param {(path: string) => Promise<{status: number, body: any}>} transport
 * @param {string} path
 * @returns {Promise<any>}
 */
export function getJSON(transport, path) {
  throw new Error('not implemented');
}

/**
 * Task 2. Load a book, then its author.
 *
 * Fulfils with { title, author }, where author is the author's name.
 * - The author lookup fails with a 404 → author is null. The book still loads.
 * - The author lookup fails any other way → reject with that error.
 * - The book lookup fails → reject with that error; do not ask for an author.
 *
 * Write it with async and await.
 *
 * @returns {Promise<{title: string, author: string | null}>}
 */
export async function getBookWithAuthor(transport, id) {
  throw new Error('not implemented');
}

/**
 * Task 3. Load several books at once.
 *
 * Fulfils with an array of book bodies, in the same order as `ids` — whatever
 * order the answers arrive in. Every request is made before any has answered.
 * If any one fails, the whole call rejects with that error.
 * No ids → an empty array.
 *
 * @param {number[]} ids
 * @returns {Promise<object[]>}
 */
export async function getBooks(transport, ids) {
  throw new Error('not implemented');
}

/**
 * Task 7. Load a shelf of books for a page that must show what it can.
 *
 * Every book is requested at once, and each request gets its own time limit of
 * `timeoutMs` (use withTimeout from Task 5). Fulfils with
 *   { books: [the bodies that loaded, in ids order],
 *     missing: [the ids that failed or ran out of time, in ids order] }
 * It never rejects because one book failed.
 *
 * @param {number[]} ids
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{books: object[], missing: number[]}>}
 */
export async function loadShelf(transport, ids, { timeoutMs = 1000 } = {}) {
  throw new Error('not implemented');
}

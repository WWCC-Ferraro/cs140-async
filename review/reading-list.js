// Written by an AI assistant, asked for "helpers for the command-line tool that
// prints a reading list, using the client in src/". The tool runs in Node.
// Nobody has run it yet. Review it in REVIEW.md — do not fix it in this file.

import { getJSON } from '../src/client.js';

const cache = new Map();

// Returns the titles of the given books, in id order.
export async function readingList(transport, ids) {
  ids.sort((a, b) => a - b);
  const books = await ids.map(id => getJSON(transport, `/books/${id}`));
  return books.map(book => book.title);
}

// A missing book is normal here, so give null instead of failing.
export async function bookOrNull(transport, id) {
  try {
    return getJSON(transport, `/books/${id}`);
  } catch (err) {
    return null;
  }
}

// Fills the cache in the background. Nobody needs to wait for this.
export function warmCache(transport, ids) {
  for (const id of ids) {
    getJSON(transport, `/books/${id}`).then(book => cache.set(id, book));
  }
}

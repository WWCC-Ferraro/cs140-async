# A bookshop client that waits well

You are building a small client for a bookshop's API: the part of a program
that asks a server for books and authors, and hands back what came.

Almost nothing in it is hard to *compute*. All of it is about *waiting*. A
request takes time. It can fail, or never answer. Some requests need the one
before; others do not. And while any of it waits, the thread must stay free.
That is this module: promises, `await`, the event loop, and the host that keeps
the clock.

There is no network. Every request goes to a **fake transport** in
`src/fake-transport.js` — a pretend server that answers after a few
milliseconds, using the host's timers. Your code cannot tell it is fake.

## Getting started

1. Open **your repository**. It is made for you: private, and named for this
   homework, the term and your username — `<term>-cs140-async-<you>`. On
   [this homework's page](https://wwcc.dev/#/lesson/async-assignment), type your GitHub
   username and click **Open my Codespace**. On your own computer, clone it
   with GitHub Desktop (**Code**, then **Open with GitHub Desktop**) and check
   that `node --version` prints 22 or later. The lesson *How a homework works*
   walks through both.
2. Run the tests:

```bash
npm test
```

Every test fails at first. That is where you start. The tests also run on
every push, and GitHub shows the result next to the commit.

**The tests are part of the spec.** They live in `test/`, one file per task.
Read them when a sentence here leaves you unsure. When one fails, its message
says what came back and where in the lessons to look.

## The API and the transport

The bookshop answers two kinds of path:

| Path | Body |
|---|---|
| `/books/<id>` | `{ id, title, authorId }` |
| `/authors/<id>` | `{ id, name }` |

A **transport** is a function. `transport(path)` returns a promise that:

- **fulfils** with `{ status, body }` whenever the server answered — a `404` or
  a `500` is still an answer;
- **rejects** with an `Error` when there was no answer at all.

The fake one writes each request to `transport.log` as it happens —
`start /books/1` when it is made, `end /books/1` when its answer arrives. Some
tests read that log to see which requests were in flight at once.

## Using an AI assistant

`AGENTS.md` in this repository tells AI coding assistants how this course wants
them to help: as a tutor who explains errors, asks questions and gives hints,
not by writing your answers. Most assistants read it automatically. It is in
the open, so read it too. It says what good AI help looks like.

## The tasks

The functions are in `src/client.js` and `src/timing.js`. Each has a comment
stating its contract. Replace each `throw new Error('not implemented')`.

Do them in order: later tasks use earlier ones.

### Task 1 · `getJSON(transport, path)`

Ask the transport for `path`. Return a promise for the body when the status
is 200–299. For any other status, reject with `httpError(path, status)` — the
helper is written for you. If the transport rejects, let that error through
untouched.

Write it with `.then`, not `await`. Most code you will read is written this
way. Tests: `test/1-get-json.test.js`.

### Task 2 · `getBookWithAuthor(transport, id)`

Load the book, then its author. Fulfil with `{ title, author }`, where
`author` is the author's name. If the author lookup answers `404`, the author
is `null` and the book still loads. Any other failure rejects.

Write it with `async` and `await`. Tests: `test/2-book-with-author.test.js`.

### Task 3 · `getBooks(transport, ids)`

Load several books. Fulfil with them in the order of `ids`, whatever order the
answers come back in. None of these requests needs another's result, so make
every request before waiting for any. If one fails, reject with its error.
Tests: `test/3-get-books.test.js`.

### Task 4 · `delay(ms)`

Return a promise that fulfils after `ms` milliseconds. While it waits, other
code must be able to run. Tests: `test/4-delay.test.js`.

### Task 5 · `withTimeout(promise, ms)`

Give a promise a time limit. If it settles in time, settle the same way. If
not, reject with `timeoutError(ms)`. Whichever happens first, leave no timer
pending. One test checks that by asking Node which timers it is still
holding. Tests: `test/5-with-timeout.test.js`.

### Task 6 · `retry(task, { attempts, delayMs })`

`task` is a function that returns a promise. Call it. If it rejects, wait
`delayMs` — with `delay` — and call it again, up to `attempts` calls in all.
Fulfil with the first success, or reject with the last error. Tests:
`test/6-retry.test.js`.

### Task 7 · `loadShelf(transport, ids, { timeoutMs })`

A page shows a shelf of books. It should show whatever loaded, and list what
did not. Request every book at once, each with its own `withTimeout`. Fulfil
with `{ books, missing }`: the books that loaded and the ids that did not, both
in `ids` order. It never rejects because one book failed. Tests:
`test/7-load-shelf.test.js`.

Then answer question 5 below: it asks you to defend a choice this task leaves
open.

## The review

`review/reading-list.js` was written by an AI assistant for the command-line
tool that prints a reading list. It runs in Node. It looks finished. It is not.

Find its defects and write them up in `REVIEW.md`. For each one, give:

- **the lines** it is on;
- **what goes wrong**, in a sentence or two;
- **a concrete input that shows it** — the call, and what happens;
- **the fix**.

There is more than one defect, and not all of them are about waiting. You may
run the file against the fake transport to confirm what you suspect. Do not fix
it in place; the fix goes in `REVIEW.md`.

No test checks the review. A person reads it.

## Answers

Write your answers under each question, in this file. A person reads them.

**1. The other form.** Write `getJSON` from Task 1 again, with `async` and
`await` this time. It must behave exactly as your chain does. Then say what
your chain's `.then` callback became in the new version.

Your answer:

**2. Order of events.** `examples/order.js` prints five lines. Write down the
order you expect, *before* you run it. Then run `node examples/order.js`. If
your prediction was wrong, say which line you placed wrong, and which queue
it was really waiting in. If it was right, say why `C` does not print before
`B`, although the fake server answers in 0 ms.

Your answer:

**3. Two hosts.** Suppose `withTimeout` did not clear its timer. You run this
Node script, and the book arrives in a few milliseconds:

```js
const book = await withTimeout(getJSON(transport, '/books/1'), 10_000);
console.log(book.title);
```

When does the program end, and why? Then say what someone would notice if the
same code ran in a browser tab instead, and what that tells you about who
decides what a pending timer does.

Your answer:

**4. One thread, two calls.** A teammate adds a cache:

```js
const cache = new Map();

async function cachedBook(transport, id) {
  if (!cache.has(id)) {
    const book = await getJSON(transport, `/books/${id}`);
    cache.set(id, book);
  }
  return cache.get(id);
}

await Promise.all([cachedBook(transport, 1), cachedBook(transport, 1)]);
```

How many requests for `/books/1` does the transport see, and why? Is this a
race condition? Is it a data race? Then say where the switch between the two
calls can happen here, and where it could happen if each call ran on its own
thread in a language with threads.

Your answer:

**5. Your design.** Should `loadShelf` retry a book that failed? Say which of
these you would retry, and why: a `404`, a `500`, no answer at all, a timeout.
Then say what retrying costs the person looking at the page. A few sentences.

Your answer:

## What done means

- `npm test` passes: every test in `test/`.
- `REVIEW.md` has a section for each defect you found.
- Every question under **Answers** has an answer.

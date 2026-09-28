// For the "Order of events" answer. Predict the order the five lines print,
// write it in the README, and only then run this:
//
//   node examples/order.js
//
// It uses your getJSON from Task 1, so finish that first.

import { getJSON } from '../src/client.js';
import { fakeTransport } from '../src/fake-transport.js';

const transport = fakeTransport({
  '/books/1': { body: { title: 'Kindred' }, ms: 0 },
});

console.log('A');
setTimeout(() => console.log('B'), 0);
getJSON(transport, '/books/1').then(book => console.log('C ' + book.title));
Promise.resolve().then(() => console.log('D'));
console.log('E');

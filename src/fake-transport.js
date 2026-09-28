// A pretend server, so nothing in this project touches the network.
//
// You do not need to change this file. The tests use it, and you can use it
// to try your code by hand (see examples/order.js).
//
// fakeTransport(routes) returns a transport: a function that takes a path and
// returns a promise, the way a real HTTP call would.
//
//   routes is an object keyed by path. Each route may have:
//     status  the response status (default 200)
//     body    the response body
//     ms      how long the "server" takes to answer (default 0)
//     fail    a message: instead of answering, the promise REJECTS with
//             new Error(fail) — the network was down, there was no answer
//
//   A path with no route answers { status: 404 }.
//
// Every call is written to transport.log as it happens:
//   "start /books/1"  when the request is made
//   "end /books/1"    when the answer (or the failure) arrives
// so you can see which requests were in flight at the same time.

export function fakeTransport(routes = {}) {
  const log = [];

  function transport(path) {
    log.push(`start ${path}`);
    const route = routes[path] ?? { status: 404, body: { error: 'not found' } };
    return new Promise((resolve, reject) => {
      // The host's timer stands in for the network: the answer arrives later.
      setTimeout(() => {
        log.push(`end ${path}`);
        if (route.fail) reject(new Error(route.fail));
        else resolve({ status: route.status ?? 200, body: route.body });
      }, route.ms ?? 0);
    });
  }

  transport.log = log;
  return transport;
}

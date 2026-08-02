/**
 * Type-level tests for pinky-swear.d.ts.
 *
 * Nothing here runs; `tsc --noEmit` failing *is* the test failure. Positive
 * expectations use `assert<Equals<...>>()`, negative ones use
 * `@ts-expect-error`, which fails the build if the line stops erroring.
 *
 * Types are asserted at call sites rather than via `ReturnType<typeof fn>`,
 * which instantiates generics with `unknown` and so would not describe what
 * a caller actually gets back.
 */

import { EventEmitter } from 'events';
import PinkySwear = require('../../pinky-swear');

type Equals<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)
        ? true
        : false;

declare function assert<T extends true>(): void;

const swear = new PinkySwear();

//
// emit() resolves with the listeners' return values.
//
const emitted = swear.emit('foo');
assert<Equals<typeof emitted, Promise<any[]>>>();

const typedEmit = swear.emit<string>('foo');
assert<Equals<typeof typedEmit, Promise<string[]>>>();

swear.emit('foo').then((results) => {
    assert<Equals<typeof results, any[]>>();
});

swear.emit<string>('foo').then((results) => {
    assert<Equals<typeof results, string[]>>();
});

// Symbols are valid event types, and extra arguments reach the listeners.
swear.emit(Symbol('foo'), 1, 'two', { three: true });

// @ts-expect-error -- emit() returns a promise, never EventEmitter's boolean.
const notABoolean: boolean = swear.emit('foo');

//
// Listener registration keeps EventEmitter's fluent, `this`-typed API, and
// listener return values are allowed (they are what emit() collects).
//
const chained = swear.on('foo', () => 'bar');
assert<Equals<typeof chained, PinkySwear>>();

const chainedOnce = swear.once('foo', () => 'bar');
assert<Equals<typeof chainedOnce, PinkySwear>>();

swear.on('foo', () => 'bar')
    .once('foo', () => Promise.resolve('baz'))
    .prependOnceListener('foo', (a: number, b: string) => [a, b])
    .removeAllListeners('foo');

swear.listenerCount('foo');
swear.setMaxListeners(20);

//
// The Promise implementation is swappable.
//
assert<Equals<typeof swear.Promise, PromiseConstructor>>();
swear.Promise = Promise;

//
// _runner is the documented extension point: callable on an instance, and
// overridable on a subclass. Asserting the call directly matters — declaring
// it on a subclass alone would compile even if the base class dropped it.
//
const ran = swear._runner([() => 'a', () => Promise.resolve('b')], 1, 2);
assert<Equals<typeof ran, Promise<any[]>>>();

const ranTyped = swear._runner<string>([() => 'a']);
assert<Equals<typeof ranTyped, Promise<string[]>>>();

class Batched extends PinkySwear {
    _runner<T = any>(tasks: PinkySwear.Listener[], ...args: any[]): Promise<T[]> {
        return this.Promise.all(tasks.map((task) => task(...args)));
    }
}

const batched = new Batched().emit('foo');
assert<Equals<typeof batched, Promise<any[]>>>();

//
// PinkySwear.Parallel is a PinkySwear with the same emit() contract.
//
const parallel = new PinkySwear.Parallel();
const asBase: PinkySwear = parallel;

const parallelEmitted = parallel.emit('foo');
assert<Equals<typeof parallelEmitted, Promise<any[]>>>();
parallel.on('foo', () => 'bar');

//
// Both classes are usable as types, and Listener is exported for consumers
// writing their own runners.
//
declare function takesSwear(swear: PinkySwear): void;
declare function takesParallel(parallel: PinkySwear.Parallel): void;
declare function takesListener(listener: PinkySwear.Listener): void;

takesSwear(swear);
takesSwear(parallel);
takesParallel(parallel);
takesListener(() => 'anything');

//
// util.inherits() copies no statics, so none of EventEmitter's exist here.
// These all type-checked before and were `undefined` at runtime.
//
// @ts-expect-error
PinkySwear.defaultMaxListeners;
// @ts-expect-error
PinkySwear.once(swear, 'foo');
// @ts-expect-error
PinkySwear.listenerCount(swear, 'foo');
// @ts-expect-error
PinkySwear.getEventListeners(swear, 'foo');
// @ts-expect-error
PinkySwear.Parallel.defaultMaxListeners;

//
// Substituting a PinkySwear for an EventEmitter is deliberately rejected:
// emit() returns a promise where callers would expect a boolean.
//
declare function takesEmitter(emitter: EventEmitter): void;
// @ts-expect-error
takesEmitter(swear);

//
// Typos stay typos.
//
// @ts-expect-error
swear.emitAsync('foo');
// @ts-expect-error
new PinkySwear.Sequential();

/// <reference types="node" />

import { EventEmitter } from 'events';

/**
 * A listener registered on a PinkySwear. Unlike a plain EventEmitter
 * listener, its return value is meaningful: it is collected (and awaited,
 * if thenable) into the array `emit()` resolves with.
 */
type Listener = (...args: any[]) => any;

/**
 * PinkySwear inherits from EventEmitter via `util.inherits()`, which wires
 * up the prototype chain but does *not* copy static members. Extending a
 * bare constructor type — rather than `EventEmitter` itself — models that:
 * instances get EventEmitter's prototype, the class gets none of its
 * statics (`EventEmitter.once`, `defaultMaxListeners`, `listenerCount`, …),
 * which is exactly what exists at runtime.
 */
declare const EventEmitterCtor: new () => EventEmitter;

declare class PinkySwear extends EventEmitterCtor {
    constructor();

    /**
     * The Promise implementation used to run listeners and to build the
     * promise returned by `emit()`. Defaults to the global `Promise`;
     * assign another A+ implementation (Bluebird, etc.) to use it instead.
     */
    Promise: PromiseConstructor;

    /**
     * Emits `type`, returning a promise for an array of the listeners'
     * return values (thenables awaited) in registration order.
     *
     * Resolves with `[]` when there are no listeners, except for `'error'`,
     * which rejects when unhandled.
     *
     * This deliberately breaks Liskov substitution with EventEmitter: the
     * base returns `boolean`, PinkySwear returns a promise. A PinkySwear is
     * therefore not usable where an `EventEmitter` is expected, even though
     * `instanceof EventEmitter` holds.
     */
    // @ts-ignore -- see above; the incompatible return type is the point of
    // the library, so the override is suppressed rather than papered over
    // with a signature that lies about what `emit()` hands back.
    emit<T = any>(type: string | symbol, ...args: any[]): Promise<T[]>;

    /**
     * Runs the listeners for an emitted event. This is the extension point
     * the class hierarchy is built on: the base runs them in sequence,
     * `PinkySwear.Parallel` runs them concurrently. Override it on a
     * subclass's prototype to supply another strategy.
     */
    _runner<T = any>(tasks: Listener[], ...args: any[]): Promise<T[]>;
}

/**
 * `PinkySwear.Parallel` is also wired up with `util.inherits()`, so the same
 * applies: it gets PinkySwear's prototype but none of its static side.
 */
declare const PinkySwearCtor: new () => PinkySwear;

declare namespace PinkySwear {
    export {
        Listener,
    };

    /**
     * A PinkySwear that invokes every listener immediately rather than
     * waiting for each one to settle before starting the next. `emit()`
     * still resolves with results in registration order.
     */
    export class Parallel extends PinkySwearCtor {}
}

export = PinkySwear;

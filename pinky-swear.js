'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    slice = Array.prototype.slice,
    debug = require('debug')('pinky-swear');

function PinkySwear() {
    PinkySwear.super_.call(this);

    this.Promise = Promise;
}
util.inherits(PinkySwear, EventEmitter);

// Based on https://github.com/cujojs/when/blob/master/sequence.js
PinkySwear.prototype._runner = function sequenceRunner (tasks, ...args) {
    const
        { Promise } = this,
        results = [];

    return Promise.all(args)
    .then(
        (args) => tasks.reduce(
            async (prevPromise, task) => {
                await prevPromise;
                const promiseOrValue = task(...args);
                results.push(promiseOrValue);
                return promiseOrValue;
            },
            Promise.resolve(),
        ),
    )
    .then(() => Promise.all(results));
}

// Based on https://github.com/cujojs/when/blob/master/parallel.js
function parallelRunner (tasks, ...args) {
    const { Promise } = this;

    return Promise.all(args)
    .then(
        (args) => tasks.map(
            async (task) => task(...args),
        ),
    )
    .then((promises) => Promise.all(promises));
}

PinkySwear.prototype.emit = function emit(type) {
    var listeners = this._events && this._events[type] || [],
        args;

    debug(this.constructor.name, 'emitting', type);

    listeners = Array.isArray(listeners) ? listeners : [listeners];

    // Cut out early if there are no listeners.
    if (!listeners.length) {

        // Reject if there's nobody to handle our error.
        if (type === 'error') {
            var er = arguments[1],
                err;

            if (er instanceof Error) {
                err = er;
            }
            else {
                err = new Error('Unhandled, unspecified "error" event. (' + er + ')');
                err.context = er;
            }

            return Promise.reject(err);
        }

        return Promise.resolve([]);
    }

    args = slice.call(arguments);
    args[0] = listeners.slice(); // Replace `type` with the array of 'tasks'.

    debug(this.constructor.name, 'listeners', listeners);

    return this._runner.apply(this, args);
};

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
                                  arguments[2]);
      default:
        // Still had to monkey patch all of `#once()`
        // just to return the result of the original listener here.
        // *le sigh*
        return this.listener.apply(this.target, arguments);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target, type, listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

PinkySwear.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('listener must be a function');
  }
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

PinkySwear.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('listener must be a function');
      }
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

module.exports = PinkySwear;

function PinkySwearParallel() {
    PinkySwearParallel.super_.call(this);
}
util.inherits(PinkySwearParallel, PinkySwear);

PinkySwearParallel.prototype._runner = parallelRunner;

module.exports.Parallel = PinkySwearParallel;

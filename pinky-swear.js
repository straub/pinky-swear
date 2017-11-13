'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    when = require('when'),
    sequence = require('when/sequence'),
    parallel = require('when/parallel'),
    slice = Array.prototype.slice,
    debug = require('debug')('pinky-swear');

function PinkySwear() {
    PinkySwear.super_.call(this);
}
util.inherits(PinkySwear, EventEmitter);

PinkySwear.prototype._runner = sequence;

PinkySwear.prototype.emit = function emit(type) {
    var listeners = this._events[type] || [],
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

            return when.reject(err);
        }

        return when.resolve([]);
    }

    args = slice.call(arguments);
    args[0] = listeners.slice(); // Replace `type` with the array of 'tasks'.

    debug(this.constructor.name, 'listeners', listeners);

    return this._runner.apply(null, args);
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

PinkySwearParallel.prototype._runner = parallel;

module.exports.Parallel = PinkySwearParallel;

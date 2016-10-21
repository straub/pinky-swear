'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    when = require('when'),
    sequence = require('when/sequence'),
    parallel = require('when/parallel'),
    slice = Array.prototype.slice;

function PinkySwear() {
    PinkySwear.super_.call(this);
}
util.inherits(PinkySwear, EventEmitter);

PinkySwear.prototype._runner = sequence;

PinkySwear.prototype.emit = function emit(type) {
    var listeners = this.listeners(type),
        args;

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
    args[0] = listeners; // Replace `type` with the array of 'tasks'.

    return this._runner.apply(null, args);
};

PinkySwear.prototype.once = function once(type, listener) {
    if (typeof listener !== 'function')
        throw new TypeError('listener must be a function');

    var fired = false,
        self = this;

    function g() {
        self.removeListener(type, g);

        if (!fired) {
            fired = true;
            // Had to monkey patch all of `#once()`
            // just to return the result of the original listener.
            // *le sigh*
            return listener.apply(self, arguments);
        }
    }

    g.listener = listener;
    this.on(type, g);

    return this;
};

module.exports = PinkySwear;

function PinkySwearParallel() {
    PinkySwearParallel.super_.call(this);
}
util.inherits(PinkySwearParallel, PinkySwear);

PinkySwearParallel.prototype._runner = parallel;

module.exports.Parallel = PinkySwearParallel;

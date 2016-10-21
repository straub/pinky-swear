
var chai = require("chai"),
    when = require("when");

global.should = chai.should();

global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;

global.fulfilledPromise = when.resolve;
global.rejectedPromise = when.reject;

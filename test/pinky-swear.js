
var PinkySwear = require('../pinky-swear');

function testPinkySwearClass(PinkySwearClass) {

    describe(PinkySwearClass.name, function () {

        it('should return a promise from emit', function () {
            var swear = new PinkySwearClass();

            expect(swear.emit('foo')).to.respondTo('then');
        });

        it ('should resolve with no listeners', function () {
            var swear = new PinkySwearClass();

            return swear.emit('foo')
            .then(function _swearResults(results) {
                expect(results).to.be.an('Array')
                    .with.length(0);
            });
        });

        it ('should resolve with the return value from the listeners', function () {
            var swear = new PinkySwearClass();

            swear.on('foo', function () { return 'bar'; });
            swear.on('foo', function () { return DelayablePromise.resolve('baz').delay(10); });

            return swear.emit('foo')
            .then(function _swearResults(results) {
                expect(results).to.be.an('Array')
                    .with.length(2);
                results[0].should.equal('bar');
                results[1].should.equal('baz');
            });
        });

        it ('should reject if a listener throws', function () {
            var swear = new PinkySwearClass();

            swear.on('foo', function () { return 'bar'; });
            swear.on('foo', function () { throw new Error('baz'); });

            return swear.emit('foo')
            .then(function _swearResults(results) {
                assert(false, 'expected rejection');
            })
            .catch(function _swearError(err) {
                expect(err).to.be.an.instanceof(Error)
                    .with.property('message', 'baz');
            });
        });

        context('#once()', function () {

            it ('should resolve with the return value from the listeners only once', function () {
                var swear = new PinkySwearClass();

                swear.once('foo', function () { return 'bar'; });
                swear.once('foo', function () { return DelayablePromise.resolve('baz').delay(10); });

                return swear.emit('foo')
                .then(function _swearResults(results) {
                    expect(results).to.be.an('Array')
                        .with.length(2);
                    results[0].should.equal('bar');
                    results[1].should.equal('baz');

                    return swear.emit('foo');
                })
                .then(function _swearResults(results) {
                    expect(results).to.be.an('Array')
                        .with.length(0);
                });
            });
        });
    });
}

testPinkySwearClass(PinkySwear);
testPinkySwearClass(PinkySwear.Parallel);

class DelayablePromise extends Promise {
    delay (ms) {
        return this.then(
            (result) => new Promise(
                (resolve) => setTimeout(
                    () => resolve(result),
                    ms,
                ),
            ),
        );
    }
}


pinky-swear
===========

promisified EventEmitter.

## Types

Type declarations ship with the package, so there is no `@types/pinky-swear`
to install. They need `@types/node`, which any TypeScript project running on
Node already has.

Note that `emit()` returns a promise rather than a `boolean`, so a PinkySwear
is deliberately *not* assignable to `EventEmitter` even though it inherits
from one.

## Test

```bash
npm test          # unit tests, then type tests
npm run test:unit
npm run test:types
npm run test:package  # check the published type wiring with attw
```

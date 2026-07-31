declare module 'pinky-swear' {
    import { EventEmitter } from 'events';

    class PinkySwear extends EventEmitter {
        constructor();

        Promise: PromiseConstructor;

        // @ts-ignore PinkySwear breaks Liskov substitution by changing this
        // method's return type from `boolean` to `Promise<any[]>`.
        emit(event: string | symbol, ...args: any[]): Promise<any[]>;
    }

    namespace PinkySwear {
        class Parallel extends PinkySwear {}
    }

    export = PinkySwear;
}

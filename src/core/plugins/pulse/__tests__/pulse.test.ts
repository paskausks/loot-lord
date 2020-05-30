import { take } from 'rxjs/operators';
import Pulse from '../pulse';

describe('Pulse', () => {
    it('should properly initialize and register an observable', (done) => {
        const plugins: Map<string, any> = new Map();
        const options = {
            knex: 'knex',
            client: 'client',
            plugins,
        } as any;

        // Init pulse with 1 second interval.
        new Pulse(options, 1);

        const observable = options.plugins.get('pulse')
        expect(observable).not.toBe(undefined);

        // we only need to wait for the first emit.
        observable.pipe(take(1)).subscribe({
            next: (val: any) => {
                expect(val).toEqual({
                    knex: 'knex',
                    discord: 'client'
                })
              },
            complete: () => done(),
        });
    });
});

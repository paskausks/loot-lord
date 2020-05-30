import { interval as intervalObservable, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PluginInitOptions, Plugin } from '..';
import { PulseMessage, PULSE_SUBJECT_KEY } from './message';

/**
 * Emit every 30 seconds.
 */
class Pulse extends Plugin {
    constructor(options: PluginInitOptions, public readonly interval: number = 30 * 1000) {
        super(options);

        const { knex, client } = options;
        const observable: Observable<PulseMessage> = from(intervalObservable(this.interval)).pipe(
            map(() => ({
                knex,
                discord: client,
            })),
        );

        options.plugins.set(PULSE_SUBJECT_KEY, observable);
    }
}

export default Pulse;

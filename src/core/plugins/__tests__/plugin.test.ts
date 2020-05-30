import { Subject } from 'rxjs';
import Plugin from '../plugin';
import LoggerMessage, { LOGGER_SUBJECT_KEY } from '../logger/message';

describe('Plugin', () => {
    describe('Plugin#log', () => {
        it('should dispatch a message to the logger subject', (done) => {
            const plugins: Map<string, any> = new Map();
            const message = 'this works!';
            const level = 'success';

            // impersonate the logger subject,
            // which _should_ be available on runtime.
            const logger: Subject<LoggerMessage> = new Subject();
            logger.subscribe((msg: LoggerMessage) => {
                expect(msg).toEqual({
                    message,
                    level,
                });
                done();
            });
            plugins.set(LOGGER_SUBJECT_KEY, logger);

            const plugin = new Plugin({ plugins } as any);
            plugin.log(message, level);
        });

        it('should throw an error if a non-existing subject is being logged to', () => {
            const plugin = new Plugin({ plugins: new Map() } as any);
            expect(() => plugin.log('foo', 'info')).toThrow(
                `Plugin Subject with key ${LOGGER_SUBJECT_KEY} not found!`,
            );
        });
    });

    describe('Plugin.create', () => {
        it('should create a Plugin instance', () => {
            const plugin = Plugin.create({} as any);
            expect(plugin instanceof Plugin).toBeTruthy();
        });
    });
});

import { Subject } from 'rxjs';
import CommandDispatcher from '../command-dispatcher';
import { COMMAND_DISPATCHER_SUBJECT, CommandDispatcherMessage } from '../message';
import { ExecContext, COMMAND_PLUGIN_PREFIX } from '../../../../commands/base'; // nice import
import { BotCommandMessage } from '../../../observables';

describe('CommandDispatcher', () => {
    const messageObj = {
        author: {
            tag: 'john#123',
        }
    };
    const knexOb = {
        select: () => null,
    };

    it('should route commands to the correct command subjects', (done) => {
        const plugins: Map<string, any> = new Map();
        const subscribeFn = jest.fn();
        const command ='foobar';
        const args = ['foo', 'bar'];

        // Add a fake command subject and subscribe to it
        const fakeCommandSubject: Subject<ExecContext> = new Subject();
        fakeCommandSubject.subscribe((ctx: ExecContext) => {
            expect(ctx).toEqual({
                msg: messageObj,
                knex: knexOb,
                args,
            });
            done();
        });
        plugins.set(`${COMMAND_PLUGIN_PREFIX}${command}`, fakeCommandSubject)

        const options = {
            knex: knexOb,
            commandMessages: {
                subscribe: subscribeFn,
            },
            plugins,
        };

        new CommandDispatcher(options as any);

        // Get command message callback and call it.
        // if everything's correct, that should be
        // routed to the fake command subject handler
        const message: BotCommandMessage = {
            message: messageObj as any,
            args,
            command,
        };
        subscribeFn.mock.calls[0][0](message);
    });

    it('should dispatch commands to the custom command observer if no builtins are matched', (done) => {
        const plugins: Map<string, any> = new Map();
        const subscribeFn = jest.fn();
        const command = 'barbaz';

        // Register a fake custom command observer.
        // regularily this is done by the SimpleCommand plugin.
        const fakeCommandSubject: Subject<CommandDispatcherMessage> = new Subject();
        fakeCommandSubject.subscribe((msg: CommandDispatcherMessage) => {
            expect(msg).toEqual({
                message: messageObj,
                knex: knexOb,
                command,
            });
            done();
        });
        plugins.set(COMMAND_DISPATCHER_SUBJECT, fakeCommandSubject);

        const options = {
            knex: knexOb,
            commandMessages: {
                subscribe: subscribeFn,
            },
            plugins,
        };

        new CommandDispatcher(options as any);

        // Attempt to trigger the custom command subject
        // observers
        const message: CommandDispatcherMessage = {
            message: messageObj as any,
            knex: knexOb as any,
            command,
        };
        subscribeFn.mock.calls[0][0](message);

    });
});

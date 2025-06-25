import { Subject } from 'rxjs';
import { Message } from 'discord.js';
import Command, { ExecContext, COMMAND_PLUGIN_PREFIX, HELP_POSTFIX } from '../base';

class FakeCommand extends Command {
    readonly trigger = 'fakecommand';

    useExec(ctx: ExecContext) {
        return this.exec(ctx);
    }

    useSendHelp(msg: Message) {
        return this.sendHelp(msg);
    }

    useGetCommands(): string[] {
        return this.getCommands();
    }
}

describe('command base', () => {
    describe('Command', () => {
        describe('Command#exec', () => {
            it('should throw an error when exec is called by default', async () => {
                expect.assertions(1);
                const command = new FakeCommand({} as any);
                try {
                    await command.useExec({} as any);
                } catch (e) {
                    expect(e).toEqual(new Error('Not implemented!'));
                }
            });
        });

        describe('Command#sendHelp', () => {
            it('should throw an error when exec is called by default', async () => {
                const sendFn = jest.fn();
                const message = {
                    channel: {
                        send: sendFn,
                    }
                } as any;

                const command = new FakeCommand({} as any);
                await command.useSendHelp(message);

                expect(sendFn).toHaveBeenCalledWith('Help not available!');
            });
        });

        describe('Command#getCommands', () => {
            it('should return a list of valid command triggers', () => {
                const plugins: Map<string, any> = new Map();
                plugins.set(`${COMMAND_PLUGIN_PREFIX}foo${HELP_POSTFIX}`, null);
                plugins.set(`${COMMAND_PLUGIN_PREFIX}bar${HELP_POSTFIX}`, null);
                plugins.set(`${COMMAND_PLUGIN_PREFIX}baz${HELP_POSTFIX}`, null);

                const options = {
                    plugins,
                } as any;

                const command = new FakeCommand(options);
                expect(command.useGetCommands()).toEqual([
                    'foo', 'bar', 'baz',
                ]);
            });
        });

        describe('Command.create', () => {
            it('should create a command instance and register rxjs subjects for commands', () => {
                const plugins: Map<string, any> = new Map();
                FakeCommand.create({ plugins } as any);

                const path = `${COMMAND_PLUGIN_PREFIX}fakecommand`;
                expect(plugins.get(path) instanceof Subject).toBeTruthy();
                expect(plugins.get(`${path}${HELP_POSTFIX}`) instanceof Subject).toBeTruthy();
            });
        });
    });
});

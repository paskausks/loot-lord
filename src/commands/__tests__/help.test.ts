import Help from '../help';
import { HELP_POSTFIX, COMMAND_PLUGIN_PREFIX } from '../base'
import { reactFail }  from '../../utils/discord';
import { buildHelp }  from '../../utils/help';

jest.mock('../../utils/discord', () => ({
    reactFail: jest.fn(),
}));

jest.mock('../../utils/help', () => ({
    buildHelp: jest.fn(),
}));

describe('Help', () => {

    beforeEach(() => {
        (reactFail as jest.MockedFunction<typeof reactFail>).mockClear();
        (buildHelp as jest.MockedFunction<typeof buildHelp>).mockClear();
    });

    afterAll(() => {
        (reactFail as jest.MockedFunction<typeof reactFail>).mockRestore();
        (buildHelp as jest.MockedFunction<typeof buildHelp>).mockRestore();
    });

    describe('Help#exec', () => {
        it('should send it\'s own help if no arguments are given', async () => {
            const plugins: Map<string, any> = new Map();
            const help = new Help({ plugins, args: [] } as any);
            const msg = {
                channel: {
                    send: () => null,
                },
            };

            jest.spyOn(help, 'sendHelp');
            await help.exec({ args: [], msg } as any);

            expect(help.sendHelp).toBeCalledWith(msg);
        });

        it('should return a message if help is not available for a command', async () => {
            const plugins: Map<string, any> = new Map();
            const help = new Help({ plugins } as any);

            await help.exec({ args: ['foobar'] } as any);

            expect(reactFail).toBeCalledWith(
                undefined,
                'The command "foobar" could not be found or help for it is not available!',
            )
        });

        it('should dispatch a message to a command to display it\'s help', async () => {
            const command = 'foobar';
            const commandSubject = {
                next: jest.fn(),
            };
            const msg = {};

            const plugins: Map<string, any> = new Map();
            plugins.set(`${COMMAND_PLUGIN_PREFIX}${command}${HELP_POSTFIX}`, commandSubject);

            const help = new Help({ plugins } as any);
            await help.exec({ args: [command], msg} as any);

            expect(commandSubject.next).toBeCalledWith(msg);
        });
    });

    describe('Help#sendHelp', () => {
        it('should list all available commands with help available in it\'s help', async () => {
            const plugins: Map<string, any> = new Map();
            const msg = {
                channel: {
                    send: () => null,
                },
            } as any;

            plugins.set(`${COMMAND_PLUGIN_PREFIX}foo${HELP_POSTFIX}`, null);
            plugins.set(`${COMMAND_PLUGIN_PREFIX}bar${HELP_POSTFIX}`, null);
            plugins.set(`${COMMAND_PLUGIN_PREFIX}baz${HELP_POSTFIX}`, null);

            const help = new Help({ plugins } as any);

            await help.sendHelp(msg);

            expect(buildHelp).toBeCalledWith({
                title: 'Loot Lord help',
                description: 'To get help for a command, type:\n`!help <somecommand>`',
                additional: [{
                    title: 'Commands with available help',
                    value: '\n▫️ `!foo`\n▫️ `!bar`\n▫️ `!baz`' ,
                }]
            });
        });
    });
});

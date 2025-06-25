import { Message, TextChannel } from 'discord.js';
import Command, {
    ExecContext, COMMAND_PLUGIN_PREFIX, HELP_POSTFIX,
} from './base';
import { getPrefix } from '../utils/bot';
import { reactFail } from '../utils/discord';
import { buildHelp } from '../utils/help';

export default class Help extends Command {
    public readonly trigger: string = 'help';

    public async exec(ctx: ExecContext): Promise<void> {
        const { args, msg } = ctx;
        if (!args.length) {
            this.sendHelp(msg);
            return;
        }

        const commandArg = args[0];

        try {
            this.dispatch<Message>(
                `${COMMAND_PLUGIN_PREFIX}${commandArg.toLowerCase()}${HELP_POSTFIX}`,
                msg,
            );
        } catch (_e) {
            reactFail(
                msg,
                `The command "${commandArg}" could not be found or help for it is not available!`,
            );
        }
    }

    public async sendHelp(msg: Message): Promise<void> {
        const prefix = getPrefix();
        const availableCommands = this.getCommands()
            .filter((cmd: string) => cmd !== this.trigger)
            .map((cmd: string) => `\n▫️ \`${prefix}${cmd}\``)
            .reduce((prev: string, current: string) => prev + current, '');

        (msg.channel as TextChannel).send(buildHelp({
            title: 'Loot Lord help',
            description: `To get help for a command, type:\n\`${prefix}${this.trigger} <somecommand>\``,
            additional: [{
                title: 'Commands with available help',
                value: availableCommands,
            }],
        }));
    }
}

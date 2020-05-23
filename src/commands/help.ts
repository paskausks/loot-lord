import { Message } from 'discord.js';
import BaseCommand, { ExecContext } from './base';
import commands from '.';
import { getPrefix } from '../utils/bot';
import { reactFail } from '../utils/discord';
import { buildHelp } from '../utils/help';

export default class Help implements BaseCommand {
    public readonly trigger: string = 'help';
    public async exec(ctx: ExecContext) {
        const { args, msg } = ctx;
        if (!args.length) {
            this.sendHelp(msg);
            return;
        }

        const commandArg = args[0];
        const command = commands.get(commandArg.toLowerCase());

        if (!command) {
            reactFail(
                msg,
                `The command "${commandArg}" could not be found or help for it is not available!`,
            );
            return;
        }

        command.sendHelp(msg);
    }

    public async update(): Promise<void> {}

    public async sendHelp(msg: Message): Promise<void> {
        const prefix = getPrefix();
        const availableCommands = Array.from(commands.keys())
            .filter((cmd: string) => cmd !== this.trigger)
            .map((cmd: string) => `\n▫️ \`${prefix}${cmd}\``)
            .reduce((prev: string, current: string) => prev + current, '');

        msg.channel.send(buildHelp({
            title: 'Loot Lord help',
            description: `To get help for a command, type:\n\`${prefix}${this.trigger} <somecommand>\``,
            additional: [{
                title: 'Commands with available help',
                value: availableCommands,
            }],
        }));
    }
}

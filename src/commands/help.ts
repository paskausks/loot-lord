import BaseCommand, { ExecContext } from './base';
import commands from '.';
import { getPrefix } from '../utils/misc';

export default class Help implements BaseCommand {
    public readonly trigger: string = 'help';
    public async exec(ctx: ExecContext) {
        if (!ctx.args.length) {
            ctx.msg.channel.send(this.help());
            return;
        }

        const commandArg = ctx.args[0];
        const command = commands.get(commandArg.toLowerCase());

        if (!command) {
            ctx.msg.channel.send(`The command "${commandArg}" could not be found or help for it is not available!`);
            return;
        }

        ctx.msg.channel.send(command.help());
    }

    public async update(): Promise<void> {}

    public help(): string {
        const prefix = getPrefix();
        const availableCommands = Array.from(commands.keys())
            .filter((cmd: string) => cmd !== this.trigger)
            .map((cmd: string) => `\n* \`${prefix}${cmd}\``)
            .reduce((prev: string, current: string) => prev + current, '');

        return `To get help for a command, type \`${prefix}${this.trigger} <somecommand>\`. `
            + `Commands with help available:${availableCommands}`;
    }
}

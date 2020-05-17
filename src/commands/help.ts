import { env } from 'process';
import BaseCommand, { ExecContext } from './base';
import commands from '.';

export default class Help implements BaseCommand {
    public async exec(ctx: ExecContext) {
        if (!ctx.args.length) {
            ctx.msg.channel.send(this.help());
            return;
        }

        const commandArg = ctx.args[0];
        const command = commands[commandArg.toLowerCase()];

        if (!command) {
            ctx.msg.channel.send(`The command "${commandArg}" could not be found or help for it is not available!`);
            return;
        }

        ctx.msg.channel.send(command.help());
    }

    public async update(): Promise<void> {}

    public help(): string {
        const prefix: string | undefined = env.DISCORD_BOT_PREFIX;
        const availableCommands = Object.keys(commands)
            .filter((cmd: string) => cmd !== 'help')
            .map((cmd: string) => `\n* \`${prefix}${cmd}\``)
            .reduce((prev: string, current: string) => prev + current, '');

        return `To get help for a command, type \`${prefix}help <somecommand>\`. `
            + `Commands with help available:${availableCommands}`;
    }
}

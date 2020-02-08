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
            ctx.msg.channel.send(`The command "${commandArg}" could not be found!`);
            return;
        }

        ctx.msg.channel.send(command.help());
    }

    public help(): string {
        return 'Displays help for other commands.';
    }
}

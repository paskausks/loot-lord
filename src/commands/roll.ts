import BaseCommand, { ExecContext } from './base';
import { getPrefix } from '../utils/misc';

export default class Roll implements BaseCommand {
    public async exec(ctx: ExecContext) {
        const { msg, args } = ctx;
        const [firstArg, secondArg] = args;
        const firstArgInt = parseInt(firstArg, 10);
        const secondArgInt = parseInt(secondArg, 10);

        if (firstArg === 'help') {
            msg.channel.send(this.help());
            return;
        }

        if (!args.length) {
            // Return a random number from 0-100.
            this.sendMessage(ctx, this.intRange().toString());
            return;
        }

        if (args.length === 1 && !Number.isNaN(firstArgInt)) {
            // Get a number from 0 to the provided number
            this.sendMessage(
                ctx,
                this.intRange(0, firstArgInt + 1).toString(),
            );
            return;
        }

        const firstArgSliceInt = parseInt(firstArg.substring(1), 10);
        if (args.length === 1 && !Number.isNaN(firstArgSliceInt) && firstArg[0].toLowerCase() === 'd') {
            // Argument is a number prefixed with d, e.g. d6 - do a dice roll.
            this.sendMessage(
                ctx,
                this.intRange(1, firstArgSliceInt + 1).toString(),
            );
            return;
        }

        if (args.length === 2 && !Number.isNaN(firstArgInt) && !Number.isNaN(secondArgInt)) {
            // Get a number between the provided numbers
            this.sendMessage(
                ctx,
                this.intRange(firstArgInt, secondArgInt).toString(),
            );
            return;
        }

        // Random choice between given options
        this.sendMessage(ctx, args[this.intRange(0, args.length)]);
    }

    private sendMessage(ctx: ExecContext, message: string) {
        ctx.msg.channel.send(`🎲 **${message}** 🎲`);
    }

    /**
     * Get a random integer between two values.
     * Upper bound exclusive.
     * 0 to 100 by default.
     */
    private intRange(from: number = 0, to: number = 101): number {
        return Math.floor(Math.random() * (to - from)) + from;
    }

    public async update(): Promise<void> {}

    public help(): string {
        const prefix = getPrefix();
        return 'Virtual dice:\n'
            + `* \`${prefix}roll\` - get a number between 0 and 100.\n`
            + `* \`${prefix}roll <to>\` - get a number from 0 to the provided number.\n`
            + `* \`${prefix}roll d<to>\` - get a number from 1 to the provided number, `
            + `e.g. \`${prefix}roll d20\` to get a number between 1 and 20.\n`
            + `* \`${prefix}roll <from> <to>\` - get a number in a provided range. Upper bound exclusive\n`
            + `* \`${prefix}roll <option> <option> <option> ...\` - pick one of given options.`;
    }
}

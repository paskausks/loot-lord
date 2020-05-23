import { Message } from 'discord.js';
import BaseCommand, { ExecContext } from './base';
import { getPrefix } from '../utils/bot';
import { reactFail } from '../utils/discord';
import { buildHelp } from '../utils/help';

/**
 * A function that returns a random floating point
 * number from 0 to 1.
 */
type RandomFunc = () => number;

/**
 * Various RNG commands.
 */
export default class Roll implements BaseCommand {
    public readonly trigger: string = 'roll';
    public async exec(ctx: ExecContext) {
        const { msg, args } = ctx;
        const [firstArg, secondArg] = args;
        const firstArgInt = parseInt(firstArg, 10);
        const secondArgInt = parseInt(secondArg, 10);

        if (firstArg === 'help') {
            this.sendHelp(msg);
            return;
        }

        if (!args.length) {
            // Return a random number from 0-100.
            this.sendMessage(ctx, Roll.intRange().toString());
            return;
        }

        if (args.length === 1) {
            if (!Number.isNaN(firstArgInt)) {
                // Get a number from 0 to the provided number
                this.sendMessage(
                    ctx,
                    Roll.intRange(0, firstArgInt + 1).toString(),
                );
                return;
            }

            reactFail(msg, 'if you are providing just 1 argument, it has to be a number!');
            return;
        }

        const firstArgSliceInt = parseInt(firstArg.substring(1), 10);
        if (args.length === 1 && !Number.isNaN(firstArgSliceInt) && firstArg[0].toLowerCase() === 'd') {
            // Argument is a number prefixed with d, e.g. d6 - do a dice roll.
            this.sendMessage(
                ctx,
                Roll.intRange(1, firstArgSliceInt + 1).toString(),
            );
            return;
        }

        if (args.length === 2 && !Number.isNaN(firstArgInt) && !Number.isNaN(secondArgInt)) {
            // Get a number between the provided numbers
            this.sendMessage(
                ctx,
                Roll.intRange(firstArgInt, secondArgInt).toString(),
            );
            return;
        }

        // Random choice between given options
        this.sendMessage(ctx, args[Roll.intRange(0, args.length)]);
    }

    private sendMessage(ctx: ExecContext, message: string) {
        ctx.msg.channel.send(`🎲 **${message}** 🎲`);
    }

    /**
     * Get a random integer between two values.
     * Upper bound exclusive.
     * 0 to 100 by default.
     */
    public static intRange(
        from: number = 0,
        to: number = 101,
        randomFunc: RandomFunc = Math.random,
    ): number {
        if (from > to) {
            return Math.floor(randomFunc() * (from - to)) + to;
        }
        return Math.floor(randomFunc() * (to - from)) + from;
    }

    public async update(): Promise<void> {}

    public async sendHelp(msg: Message): Promise<void> {
        const prefix = getPrefix();
        msg.channel.send(buildHelp({
            title: this.trigger,
            description: 'Virtual dice.',
            commands: [
                {
                    command: this.trigger,
                    explanation: 'Get a number between 0 and 100.',
                },
                {
                    command: `${this.trigger} <to>`,
                    explanation: 'Get a number from 0 to the provided number.',
                },
                {
                    command: `${this.trigger} d<to>`,
                    explanation: 'Get a number from 1 to the provided number. '
                    + `e.g. \`${prefix}${this.trigger} d20\` to get a number between 1 and 20.`,
                },
                {
                    command: `${this.trigger} <from> <to>`,
                    explanation: 'Get a number in a provided range. Upper bound exclusive.',
                },
                {
                    command: `${this.trigger} <option> <option> <option> ...`,
                    explanation: 'Pick one of given options.',
                },
            ],
        }));
    }
}

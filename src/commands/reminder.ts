import moment from 'moment';
import BaseCommand, { ExecContext, UpdateContext } from './base';

/*
 * Reminders inspired by Slack.
 * https://slack.com/intl/en-lv/help/articles/208423427-Set-a-reminder
 */

interface ParseResult {
    time: moment.Moment;
    reminder: string;
}

export default class Reminder implements BaseCommand {
    public async exec(ctx: ExecContext) {
        const [subCommand] = ctx.args;

        const validSubCommands = [
            '`add`',
            '`rm`',
            '`list`',
        ].join(', ');

        const { msg } = ctx;

        if (!ctx.args.length) {
            ctx.msg.channel.send(this.help());
            return;
        }
        switch (subCommand) {
        case 'rm':
            break;
        case 'add':
            break;
        case 'list':
            break;
        default:
            msg.channel.send(
                `Invalid subcommand. Try: ${validSubCommands}`,
            );
        }
    }

    public async update(_ctx: UpdateContext): Promise<void> {}

    public parseReminder(message: string, from: Date = new Date()): ParseResult {
        // time designations begin either with "in", "at" or "on"
        // so we treat them separately.
        const sourceTime = moment(from);
        const targetTime = sourceTime.clone();
        const match = /(.+) in (\d+\.?\d*) ([a-zA-Z]+)$/.exec(message);

        if (!match) {
            throw new Error('Not a valid match!');
        }

        // Starts with "in"
        const reminder = match[1].trim();
        const amount = parseFloat(match[2]);
        const type = match[3];

        if (Number.isNaN(amount)) {
            throw new Error('Not a valid time amount!');
        }

        targetTime.add(amount, type as moment.DurationInputArg2);
        if (sourceTime.isSame(targetTime)) {
            // "add" operation failed, time was unmodified.
            throw new Error('Not a valid time unit type!');
        }

        return {
            time: targetTime,
            reminder,
        };
    }

    public help(): string {
        return 'Manage personal reminders:\n'
            + '* `reminder list` - view your reminders\n'
            + '* `reminder rm <reminder number>` - remove a reminder (get the number with `list``)\n'
            + '* `reminder add Some reminder text <time>` - add a new reminder "Some reminder text" for the given time.\n\n'
            + 'Valid input examples for the time are `in 17 minutes`, `in 1 hour`, `in 3 days`, '
            + '`at 8:55pm`, `at 16:00`, `at midnight`, `on January 1`, `on 9 Feb`, '
            + '`on 30.11.2020` (MM.DD.YYYY), `on Thursday` etc.';
    }
}

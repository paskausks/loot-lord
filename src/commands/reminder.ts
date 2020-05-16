import moment from 'moment';
import BaseCommand, { ExecContext, UpdateContext } from './base';
import { isValidSequenceNumber } from '../utils/number';
import {
    reactSuccess as success,
    reactFail as fail,
    getMoment,
} from '../utils/discord';
import { Reminder as ReminderModel } from '../models';

/*
 * Reminders inspired by Slack.
 * https://slack.com/intl/en-lv/help/articles/208423427-Set-a-reminder
 */

interface ParseResult {
    dateTime: moment.Moment;
    reminder: string;
}

type ReminderMessageParser = (message: string, sourceDate: moment.Moment) => ParseResult | null;

/*
 * Message parsers add support for various
 * message formats through which reminders
 * can be created.
 */
const messageParsers: ReminderMessageParser[] = [
    /*
     * Messages starting with "in"
     * e.g. "in 3 hours", "in 5 days", etc.
     */
    (message, sourceDate) => {
        const result = /(.+) in (\d+\.?\d*) ([a-zA-Z]+)$/.exec(message);
        const targetTime = sourceDate.clone();

        if (!result) {
            return null;
        }

        const reminder = result[1].trim();
        const amount = parseFloat(result[2]);
        const type = result[3];

        if (Number.isNaN(amount)) {
            throw new Error('Not a valid time amount!');
        }

        targetTime.add(amount, type as moment.DurationInputArg2);
        if (sourceDate.isSame(targetTime)) {
            // "add" operation failed, time was unmodified.
            return null;
        }

        return {
            dateTime: targetTime,
            reminder,
        };
    },

    /*
     * Messages with the format "on <month> <date>" and "on <date> <month>"
     * e.g. "on January 1", "on March 4th", "on Jun 22", "on 1 January",
     * "on 3rd April", "on 14th of Nov" etc.
     */
    (message, sourceDate) => {
        let result = /(.+) on ([a-zA-Z]{2,}) (\d+)(st|nd|rd|th)?$/.exec(message);
        let month: string;
        let date: number;
        let suffix: string | undefined;

        /* eslint-disable prefer-destructuring */
        if (result) {
            month = result[2];
            date = parseInt(result[3], 10);
            suffix = result[4];
        } else {
            // Try reversed
            result = /(.+) on (\d+)(st|nd|rd|th)? (?:of )?([a-zA-Z]{3,})/.exec(message);

            if (!result) {
                return null;
            }

            date = parseInt(result[2], 10);
            suffix = result[3];
            month = result[4];
        }
        /* eslint-enable prefer-destructuring */

        const reminder = result[1].trim();

        if (Number.isNaN(date)) {
            return null;
        }

        if (suffix && !isValidSequenceNumber(date + suffix)) {
            return null;
        }

        const newDate = moment(date.toString() + month, [
            'DMMM', // 1Mar
            'DMMMM', // 1March
            'DDMMM', // 01Mar
            'DDMMMM', // 01March
        ], true);

        if (!newDate.isValid()) {
            return null;
        }

        return {
            dateTime: newDate.isBefore(sourceDate) ? newDate.add(1, 'y') : newDate,
            reminder,
        };
    },

    /*
     * Messages with the format "on DD.MM.YYYY"
     * e.g. "12.03.2020", "12.4.2020", "1.03.20"
     * etc.
     */
    (message, sourceDate) => {
        const result = /(.+) on (\d{1,2}\.\d{1,2}\.(:?\d{2}|\d{4}))$/.exec(message);

        if (!result) {
            return null;
        }

        const reminder = result[1].trim();
        const newDate = moment(result[2], [
            'D.M.YYYY',
            'D.M.YY',
        ], true);

        if (!newDate.isValid() || newDate.isBefore(sourceDate)) {
            return null;
        }

        return {
            dateTime: newDate,
            reminder,
        };
    },

    /*
     * Messages with the format "on <day>"
     * e.g. "Mon", "Tue", "Thursday", etc.
     * etc.
     */
    (message) => {
        const result = /(.+) on ([a-zA-Z]{3,9})$/.exec(message);

        if (!result) {
            return null;
        }

        const reminder = result[1].trim();
        const newDate = moment(result[2], [
            'ddd', // Mon, Tue, Wed, etc.
            'dddd', // Monday, Tuesday, etc.
        ], true);

        if (!newDate.isValid()) {
            return null;
        }

        return {
            dateTime: newDate.isBefore(new Date()) ? newDate.add(1, 'week') : newDate,
            reminder,
        };
    },
];

export default class Reminder implements BaseCommand {
    private table: string = 'reminders';
    private static REMINDER_MAXLENGTH: number = 250;

    public async exec(ctx: ExecContext) {
        const [subCommand, ...args] = ctx.args;

        const validSubCommands = [
            '`add`',
            '`rm`',
            '`list`',
        ].join(', ');

        const { msg, knex } = ctx;

        if (!ctx.args.length) {
            msg.channel.send(this.help());
            return;
        }
        switch (subCommand) {
        case 'rm':
            break;
        case 'add': {
            const reminderQuery = args.join(' ');
            const reminderData = this.parseReminder(reminderQuery);

            if (!reminderData) {
                fail(msg, 'Your syntax is incorrect. Check the command help and try again!');
                return;
            }

            const { reminder, dateTime } = reminderData;
            const reminderLength = reminder.length;

            if (reminderLength > Reminder.REMINDER_MAXLENGTH) {
                fail(msg, `Your reminder is too long. It has ${reminderLength} characters, but should not exceed ${Reminder.REMINDER_MAXLENGTH}!`);
                return;
            }

            // FIXME: see moment error on add.
            await knex(this.table).insert({
                user_id: msg.author.id,
                reminder,
                reminder_at: dateTime.toISOString(),
            });

            success(msg, `Your reminder has been added! I'll notify you about it at **${getMoment(dateTime.utc().format('lll'))}**!`);
            break;
        }
        case 'list': {
            // TODO: Filter out completed items (or may be just delete on completion)
            const all = await knex
                .select()
                .from<ReminderModel>(this.table)
                .where('user_id', msg.author.id)
                .orderBy('created_at', 'desc');

            success(msg, `\`\`\`${JSON.stringify(all, null, 4)}\`\`\``);
            break;
        }
        default:
            msg.channel.send(
                `Invalid subcommand. Try: ${validSubCommands}`,
            );
        }
    }

    public async update(_ctx: UpdateContext): Promise<void> {}

    public parseReminder(message: string, from: Date = new Date()): ParseResult | null {
        // time designations begin either with "in", "on"
        // so we treat them separately.
        const sourceTime = moment(from);

        for (let i = 0; i < messageParsers.length; i += 1) {
            const result = messageParsers[i](message, sourceTime);

            if (result) {
                return result;
            }
        }

        return null;
    }

    public help(): string {
        return 'Manage personal reminders:\n'
            + '* `reminder list` - view your reminders\n'
            + '* `reminder rm <reminder number>` - remove a reminder (get the number with `list``)\n'
            + '* `reminder add Some reminder text <time>` - add a new reminder "Some reminder text" for the given time.\n\n'
            + 'Valid input examples for the <time> value are `in 17 minutes`, `in 1 hour`, `in 3 days`, '
            + '`on January 1`, `on March 4th`, `on 9 Feb`, `on 30.11.2020` (MM.DD.YYYY), '
            + '`on Thursday`, `on Wed`, `on friday`, etc.';
    }
}

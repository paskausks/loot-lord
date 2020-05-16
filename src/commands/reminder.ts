import Knex from 'knex';
import moment from 'moment-timezone';
import BaseCommand, { ExecContext, UpdateContext } from './base';
import { isValidSequenceNumber } from '../utils/number';
import {
    reactSuccess as success,
    reactFail as fail,
    getUser,
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
        const result = /([\s\S]+)in (\d+\.?\d*) ([a-zA-Z]+)$/.exec(message);
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
        let result = /([\s\S]+)on ([a-zA-Z]{2,}) (\d+)(st|nd|rd|th)?$/.exec(message);
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
            result = /([\s\S]+)on (\d+)(st|nd|rd|th)? (?:of )?([a-zA-Z]{3,})/.exec(message);

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
        const result = /([\s\S]+)on (\d{1,2}\.\d{1,2}\.(:?\d{2}|\d{4}))$/.exec(message);

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
        const result = /([\s\S]+)on ([a-zA-Z]{3,9})$/.exec(message);

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

    constructor() {
        // Load timezone data
        moment.tz.load({
            version: 'latest',
            zones: [],
            links: [],
        });
    }

    public async exec(ctx: ExecContext) {
        const [subCommand, ...args] = ctx.args;

        const validSubCommands = [
            '`add`',
            '`rm`',
            '`list`',
        ].join(', ');

        const { msg } = ctx;

        if (!ctx.args.length) {
            msg.channel.send(this.help());
            return;
        }

        switch (subCommand) {
        case 'rm':
            await this.remove(ctx);
            break;
        case 'add': {
            const reminderQuery = args.join(' ');
            await this.add(ctx, reminderQuery);
            break;
        }
        case 'list': {
            await this.list(ctx);
            break;
        }
        default:
            msg.channel.send(
                `Invalid subcommand. Try: ${validSubCommands}`,
            );
        }
    }

    public async update(ctx: UpdateContext): Promise<void> {
        const all = await ctx.knex
            .select()
            .from<ReminderModel>(this.table)
            .where('reminder_at', '<=', moment().toISOString());

        if (!all.length) {
            return;
        }

        // Clear processed.
        await ctx.knex
            .select()
            .from(this.table)
            .whereIn('id', (all as ReminderModel[]).map((reminder) => reminder.id))
            .del();

        // Notify users.
        all.forEach((reminder: ReminderModel) => {
            getUser(ctx.discord, reminder.user_id).then((user) => {
                if (!user) {
                    return;
                }

                user.send(`${reminder.reminder}\n`, {
                    embed: {
                        description: `_This is an automated reminder\nCreated with [this message](${reminder.reminder_url})._`,
                        color: 2258916,
                    },
                });
            });
        });
    }

    private async add(ctx: ExecContext, reminderQuery: string) {
        const { msg, knex } = ctx;
        const reminderData = this.parseReminder(reminderQuery);

        if (!reminderData) {
            fail(msg, 'Your syntax is incorrect. Check the command help and try again!');
            return;
        }

        const { reminder, dateTime } = reminderData;
        const reminderLength = reminder.length;

        if (reminderLength > Reminder.REMINDER_MAXLENGTH) {
            fail(
                msg,
                `Your reminder is too long. It has ${reminderLength} `
                + `characters, but should not exceed ${Reminder.REMINDER_MAXLENGTH}!`,
            );
            return;
        }

        await knex(this.table).insert({
            user_id: msg.author.id,
            reminder,
            reminder_at: dateTime.toISOString(),
            reminder_url: msg.url,
        });

        success(
            msg,
            'Your reminder has been added! I\'ll notify you about it at '
            + `${dateTime.utc().format('lll')} UTC - _${dateTime.fromNow()}_!`,
        );
    }

    /**
     * Returns all reminders for a user
     */
    private async getAll(knex: Knex, forId: string): Promise<ReminderModel[]> {
        return knex
            .select()
            .from<ReminderModel>(this.table)
            .where('user_id', forId)
            .orderBy('reminder_at', 'asc');
    }

    private async remove(ctx: ExecContext) {
        let removeIndex = parseInt(ctx.args[1], 10);
        const failMsg = 'Invalid reminder number. Check again with the `reminder list` command!';

        if (Number.isNaN(removeIndex)) {
            fail(ctx.msg, failMsg);
            return;
        }

        removeIndex = Math.abs(removeIndex - 1);
        const reminder = (await this.getAll(ctx.knex, ctx.msg.author.id))[removeIndex];

        if (!reminder) {
            fail(ctx.msg, failMsg);
            return;
        }

        const rowsAffected = await ctx.knex(this.table)
            .where('id', reminder.id)
            .del();

        if (!rowsAffected) {
            fail(ctx.msg, 'Something went wrong.');
            return;
        }

        success(ctx.msg);
    }

    private async list(ctx: ExecContext) {
        const tzArg = ctx.args[1];
        let zone: moment.MomentZone | null = null;

        if (tzArg) {
            zone = moment.tz.zone(tzArg);
        }

        const all = await this.getAll(ctx.knex, ctx.msg.author.id);

        if (!all.length) {
            ctx.msg.channel.send('You currently don\'t have any reminders.');
            return;
        }

        const fields = all.map((reminder: ReminderModel, index: number) => {
            const dateTime = moment(reminder.reminder_at);
            const dateFormatted = zone ? dateTime.tz(tzArg) : dateTime.utc();
            return {
                name: `**${index + 1}** - _${dateFormatted.format('lll')}_`,
                value: `${reminder.reminder}`,
            };
        });

        ctx.msg.channel.send({
            embed: {
                title: 'Your reminders',
                description: `All times shown in ${zone ? zone.name : 'UTC'}.\n\n`,
                fields,
            },
        });
    }

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
            + '* `reminder list` - view your reminders. Optionally, provide a timezone argument, like '
            + '``list EET` or `list Europe/Riga` to convert the times.\n'
            + '* `reminder rm <reminder number>` - remove a reminder (get the number with `list`)\n'
            + '* `reminder add Some reminder text <time>` - add a new reminder "Some reminder text" for the given time.\n\n'
            + 'Valid input examples for the <time> value are `in 17 minutes`, `in 1 hour`, `in 3 days`, '
            + '`on January 1`, `on March 4th`, `on 9 Feb`, `on 30.11.2020` (DD.MM.YYYY), '
            + '`on Thursday`, `on Wed`, `on friday`, etc.';
    }
}

import Knex from 'knex';
import moment from 'moment';
import { Subject } from 'rxjs';
import { Message } from 'discord.js';
import Command, { ExecContext } from '../base';
import {
    reactSuccess as success,
    reactFail as fail,
    getUser,
} from '../../utils/discord';
import { getPrefix } from '../../utils/bot';
import { buildHelp } from '../../utils/help';
import { Reminder as ReminderModel } from '../../models';
import messageParsers, { ParseResult } from './parsers';
import { PULSE_SUBJECT_KEY, PulseMessage } from '../../core/plugins/pulse/message';
import { PluginInitOptions } from '../../core/plugins';

/*
 * Reminders inspired by Slack.
 * https://slack.com/intl/en-lv/help/articles/208423427-Set-a-reminder
 */
export default class Reminder extends Command {
    public readonly trigger: string = 'reminder';
    private table: string = 'reminders';
    private static REMINDER_MAXLENGTH: number = 250;

    constructor(options: PluginInitOptions) {
        super(options);
        (options.plugins.get(PULSE_SUBJECT_KEY) as Subject<PulseMessage>).subscribe(
            this.update.bind(this),
        );
    }

    public async exec(ctx: ExecContext) {
        const [subCommand, ...args] = ctx.args;

        const validSubCommands = [
            '`add`',
            '`rm`',
            '`list`',
            '`help`',
        ].join(', ');

        const { msg } = ctx;

        if (!ctx.args.length) {
            this.sendHelp(msg);
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
        case 'help': {
            this.sendHelp(msg);
            break;
        }
        default:
            msg.channel.send(
                `Invalid subcommand. Try: ${validSubCommands}`,
            );
        }
    }

    public async update(ctx: PulseMessage): Promise<void> {
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
        const reminderData = Reminder.parseReminder(reminderQuery);

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
        const all = await this.getAll(ctx.knex, ctx.msg.author.id);

        if (!all.length) {
            ctx.msg.channel.send('You currently don\'t have any reminders.');
            return;
        }

        const fields = all.map((reminder: ReminderModel, index: number) => {
            const dateTime = moment(reminder.reminder_at);
            return {
                name: `**${index + 1}** - _${dateTime.utc().format('lll')}_`,
                value: `${reminder.reminder}`,
            };
        });

        ctx.msg.channel.send({
            embed: {
                title: 'Your reminders',
                description: 'All times shown in UTC.\n\n',
                fields,
            },
        });
    }

    public static parseReminder(message: string, from: Date = new Date()): ParseResult | null {
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

    public async sendHelp(msg: Message): Promise<void> {
        const prefix = getPrefix();
        msg.channel.send(buildHelp({
            title: this.trigger,
            description: 'Manage personal reminders.',
            commands: [
                {
                    command: `${this.trigger} list`,
                    explanation: 'View your reminders.',
                },
                {
                    command: `${this.trigger} rm <reminder number>`,
                    explanation: 'Remove a reminder (get the number with `list`).',
                },
                {
                    command: `${this.trigger} add Some reminder text <time>`,
                    explanation: 'Add a new reminder "Some reminder text" for the '
                    + 'given time. The reverse also works - you can do '
                    + `\`${prefix}${this.trigger} add <time> Some reminder text\``,
                },
            ],
            additional: [{
                title: '⏲️ Valid input examples',
                value: 'Valid input examples for the <time> value are `in 17 minutes`, '
                + '`in 1 hour`, `in 3 days`, `on January 1`, `on March 4th`, `on 9 Feb`, '
                + '`on 30.11.2020` (DD.MM.YYYY), `on 14.02` (DD.MM), `on Thursday`, '
                + '`on Wed`, `on friday`, etc.',
            }],
        }));
    }
}

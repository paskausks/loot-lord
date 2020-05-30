import Knex from 'knex';
import { Message, MessageReaction, User } from 'discord.js';
import Command, { ExecContext } from './base';
import { PluginInitOptions } from '../core/plugins';
import { Quote as QuoteModel } from '../models';
import { reactFail, reactSuccess, getNickname } from '../utils/discord';
import { buildHelp } from '../utils/help';
import { getMoment } from '../utils/moment';
import { getNewestRegularMessage } from '../utils/bot';

export default class Quote extends Command {
    public readonly trigger: string = 'quote';
    public readonly table: string = 'quotes';
    private static readonly REACTION_VOTE_EMOJI: string = '👍';

    constructor(options: PluginInitOptions) {
        super(options);
        options.addedReactions.subscribe(([reaction, user]) => {
            this.handleReaction(reaction, user, options.knex);
        });

        // Clean up old quotes on startup.
        options.ready.subscribe(() => this.cleanUp(options.knex));
    }

    public async exec(ctx: ExecContext): Promise<void> {
        const { msg, args } = ctx;

        if (!args.length) {
            await this.sendHelp(msg);
            return;
        }

        switch (args[0]) {
        case 'random': {
            this.getRandom(ctx);
            return;
        }
        case 'nominate': {
            this.handleNomination(ctx);
            return;
        }
        default:
            this.sendHelp(msg);
        }
    }

    private async getRandom(ctx: ExecContext): Promise<void> {
        const { knex, msg } = ctx;
        const [messageData] = await knex
            .select('message', 'author_id', 'message_url', 'created_at')
            .from<QuoteModel>(this.table)
            .where('accepted', 1)
            .limit(1)
            .orderByRaw('random()');

        if (!messageData) {
            reactFail(msg, 'No quotes found in the database!');
            return;
        }

        msg.channel.send({
            embed: {
                description: `${messageData.message}\n\n`
                + `- _[${await getNickname(msg, messageData.author_id)}](${messageData.message_url}), `
                + `${getMoment(messageData.created_at).year()}_\n\n`,
            },
        });
    }

    private async handleNomination(ctx: ExecContext): Promise<void> {
        const { msg, knex } = ctx;
        const lastMessage = await getNewestRegularMessage(msg);

        if (!lastMessage) {
            reactFail(msg, 'I don\'t have any messages cached which you can nominate!');
            return;
        }

        if (msg.author.id === lastMessage.author.id) {
            reactFail(msg, 'You can\'t nominate your own messages!');
            return;
        }

        // Check if message isn't already in the database
        const [messageData] = await knex
            .select('id')
            .from<QuoteModel>(this.table)
            .where('message_id', lastMessage.id)
            .limit(1);

        if (messageData) {
            reactFail(msg, 'Message already seen!');
            return;
        }

        await knex<QuoteModel>(this.table).insert({
            author_id: lastMessage.author.id,
            nominee_id: msg.author.id,
            message_id: lastMessage.id,
            message: lastMessage.content,
            message_url: lastMessage.url,
        });

        reactSuccess(
            msg,
            `Message by ${await getNickname(msg, lastMessage.author.id)} nominated! `
            + `React with ${Quote.REACTION_VOTE_EMOJI} on it to add as a quote!`,
        );
    }

    private async handleReaction(reaction: MessageReaction, user: User, knex: Knex): Promise<void> {
        const { message, emoji } = reaction;

        if (message.author.id === user.id) {
            return;
        }

        if (emoji.toString() !== Quote.REACTION_VOTE_EMOJI) {
            return;
        }

        // See if message was nominated
        const [messageData] = await knex
            .select('message_id')
            .from<QuoteModel>(this.table)
            .where('message_id', message.id)
            .andWhere('accepted', 0)
            .limit(1);

        if (!messageData) {
            return;
        }

        await knex<QuoteModel>(this.table)
            .where('message_id', messageData.message_id)
            .update({ accepted: 1 });

        reactSuccess(message, 'Message added to quotes!');
    }

    private async cleanUp(knex: Knex): Promise<void> {
        const rows = await knex
            .select('id')
            .from<QuoteModel>(this.table)
            .where('accepted', 0)
            .del();

        if (!rows) {
            return;
        }

        this.log(`Removed ${rows} non-accepted quotes!`);
    }

    public async sendHelp(msg: Message): Promise<void> {
        msg.channel.send(buildHelp({
            title: this.trigger,
            description: 'Manage quotes.',
            commands: [
                {
                    command: `${this.trigger} random`,
                    explanation: 'Get a random quote.',
                },
                {
                    command: `${this.trigger} nominate`,
                    explanation: 'Nominate the previous message as a quote. If someone reacts '
                        + `with ${Quote.REACTION_VOTE_EMOJI} on the nominated message, it'll be added to the database. `
                        + 'You can only nominate messages which don\'t come from the bot and aren\'t '
                        + 'bot commands. You can\'t nominate your own messages. Reacting to your own '
                        + 'messages won\'t count.',
                },
            ],
        }));
    }
}

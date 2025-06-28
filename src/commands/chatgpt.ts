import { Message, TextChannel, User } from 'discord.js';
import Command, { ExecContext } from './base';
import { buildHelp } from '../utils/help';
import OpenAI from "openai";
import { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';
import { PluginInitOptions } from '../core/plugins';
import fs from 'fs';
import { Knex } from 'knex';
import { ChatGPTPreviousResponse } from '../models';

export default class ChatGPT extends Command {
    public readonly trigger: string = 'ai';
    public readonly table: string = 'chatgpt';

    private readonly model: string = process.env.DISCORD_BOT_OPENAI_MODEL || '';
    private readonly openAIClient?: OpenAI;
    private readonly instructions: string = '';

    constructor(options: PluginInitOptions) {
        super(options);

        const apiKey = process.env.DISCORD_BOT_OPENAI_API_KEY || '';

        if (!apiKey.length) {
            return;
        }

        this.openAIClient = new OpenAI({ apiKey });

        const instructionsFilePath = (process.env.DISCORD_BOT_OPENAI_INSTRUCTIONS_PATH || '');

        if (!fs.existsSync(instructionsFilePath)) {
            return;
        }

        this.instructions = fs.readFileSync(instructionsFilePath).toString();
    }

    public async exec(ctx: ExecContext): Promise<void> {
        if (!this.openAIClient) {
            return;
        }

        const message = ctx.msg;

        if (!ctx.args.length) {
            this.sendHelp(message);
            return;
        }

        let instructions = this.instructions;
        instructions += `\n\nYour nickname is ${message.client.user.displayName}.`;

        const id = ChatGPT.createId(ctx.msg);
        const previousResponseEntry: { previous_response_id: string } | undefined = await this.getPreviousResponseId(ctx.knex, id);

        let input = '';
        const author = message.author;
        const authorId = ChatGPT.generateAuthorString(author);

        if (ChatGPT.isDM(message)) {
            input += `Direct message from ${authorId}:`;
        } else {
            input += `Public chat message from ${authorId}:`;
        }

        input += '\n\n' + message.cleanContent.substring(2 + this.trigger.length);

        const referenceMessageId = message.reference?.messageId;
        if (referenceMessageId) {
            // possibly a reply
            const replyMessage = await message.channel.messages.fetch(referenceMessageId);
            input += `\n\nMessage content end. The above message is a reply to this message from ${ChatGPT.generateAuthorString(replyMessage.author)}:`;
            input += '\n\n' + replyMessage.cleanContent;
        }

        const options: ResponseCreateParamsNonStreaming = {
            model: this.model,
            instructions,
            input
        };

        if (previousResponseEntry) {
            options['previous_response_id'] = previousResponseEntry.previous_response_id;
        }

        const response = await this.openAIClient.responses.create(options);

        this.createEntry(ctx.knex, id, response.id, Boolean(previousResponseEntry));

        ctx.msg.reply(response.output_text);
    }

    public async sendHelp(msg: Message): Promise<void> {
        if (msg.channel.isTextBased()) {
            (msg.channel as TextChannel).send(buildHelp({
                title: this.trigger,
                description: 'Utilizes ChatGPT for interactive replies',
            }));
        }
    }

    private static isDM(msg: Message): boolean {
        return !!msg.guild;
    }

    private static createId(msg: Message): string {
        let prefix: string;
        let id: string;

        if (msg.guild) {
            prefix = 'g';
            id = msg.guild.id;
        } else {
            prefix = 'a';
            id = msg.author.id;
        }

        return `${prefix}:${id}`;
    }

    private static generateAuthorString(author: User): string {
        return `${author.displayName}, user ID ${author.id}`;
    }

    private async createEntry(
        knex: Knex,
        entityId: string,
        previousResponseId: string,
        update: boolean,
    ): Promise<void> {
        if (update) {
            await knex(this.table).where({ entity_id: entityId }).update({
                previous_response_id: previousResponseId,
            });
            return;
        }

        await knex(this.table).insert({
            entity_id: entityId,
            previous_response_id: previousResponseId,
        });
    }

    private async getPreviousResponseId(
        knex: Knex,
        entityId: string,
        fields: string[] = ['previous_response_id'],
    ): Promise<{ previous_response_id: string } | undefined> {
        const [result] = await knex
            .select(...fields)
            .from<ChatGPTPreviousResponse>(this.table)
            .where('entity_id', entityId)
            .limit(1) as ChatGPTPreviousResponse[];
        return result;
    }
}

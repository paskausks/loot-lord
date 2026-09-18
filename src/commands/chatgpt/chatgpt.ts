import OpenAI from "openai";
import {
    ResponseCreateParamsNonStreaming,
    ResponseInputImage,
    ResponseInputText,
    ResponseUsage
} from 'openai/resources/responses/responses';
import fs from 'fs';
import { Knex } from 'knex';
import * as cheerio from 'cheerio';
import { APIEmbedField, ClientUser, Embed, Message, TextChannel, User } from 'discord.js';
import Command, { ExecContext } from '../base';
import { buildHelp } from '../../utils/help';
import { PluginInitOptions } from '../../core/plugins';
import { ChatGPTPreviousResponse } from '../../models';
import URLCrawlResult, { URLType } from './url-crawl-result';
import supplementaryInstructions from './supplementary-instructions';
import EmbedParseResult from "./embed-parse-result";
import { reactFail, reactSuccess } from "../../utils/discord";
import summaryPrompt from "./summary-prompt";

type PreviousResponseId = Pick<ChatGPTPreviousResponse, 'previous_response_id'>;

export default class ChatGPT extends Command {
    public readonly trigger: string = 'g';
    public readonly table: string = 'chatgpt';

    private readonly model: string = process.env.DISCORD_BOT_OPENAI_MODEL || '';
    private readonly openAIClient?: OpenAI;
    private readonly instructions: string = '';
    // match https://, link can also be wrapped in angle brackets.
    private readonly linkPattern: RegExp = /(https?:\/\/[.\S]+[^>])\s?/gm;
    private readonly processingQueue: ExecContext[] = [];
    private readonly systemUserIds: string[] = [];
    private isProcessing: boolean = false;
    private tokenCost: Map<string, ResponseUsage | undefined> = new Map();

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
        this.systemUserIds = (process.env.DISCORD_BOT_OPENAI_SYS_USERIDS || '').split(',').filter((v) => v !== '');
    }

    public async exec(ctx: ExecContext): Promise<void> {
        if (this.isProcessing) {
            this.processingQueue.push(ctx);
            return;
        }

        // process messages one by one to keep the conversation threads linear.
        this.isProcessing = true;

        if (!this.openAIClient) {
            this.processNext();
            return;
        }

        const {msg: message, args} = ctx;

        if (!args.length) {
            this.sendHelp(message);
            this.processNext();
            return;
        }

        await (message.channel as TextChannel).sendTyping();

        const firstArg: string = args[0];
        let instructions = this.instructions;
        instructions += supplementaryInstructions;

        const botUser: ClientUser = message.client.user;
        instructions += `\n\nYour nickname is ${botUser.displayName}, ID: ${botUser.id}.`;

        const id = ChatGPT.createId(ctx.msg);

        if (firstArg === 'tokens') {
            this.isProcessing = false;
            const tokenCost: ResponseUsage | undefined = this.tokenCost.get(id);

            if (!tokenCost) {
                reactSuccess(message, 'Token count not available. Send a prompt and try again!');
                return;
            }

            let reply: string = 'Last prompt token cost breakdown:\n\n';
            reply += `* in: ${tokenCost.input_tokens}\n`;
            reply += `* out: ${tokenCost.output_tokens}\n`;
            reply += `* total: ${tokenCost.total_tokens}`;
            reactSuccess(message, reply);

            return;
        }

        const hasSysPerm: boolean = this.systemUserIds.indexOf(message.author.id) !== -1;
        const isSysPrompt = firstArg === 'sys' && hasSysPerm;

        const previousResponseEntry: PreviousResponseId | undefined = await this.getPreviousResponseId(ctx.knex, id);

        if (firstArg === 'reset') {
            if (!ChatGPT.isDM(message) && !hasSysPerm) {
                await reactFail(message, 'You don\'t have public chat reset permissions!');
                this.processNext();
                return;
            }

            if (!previousResponseEntry) {
                await reactFail(message, 'No conversation to reset!');
                this.processNext();
                return;
            }

            await this.performReset(ctx.knex, id, message, previousResponseEntry.previous_response_id, instructions);
            return;
        }

        let text = '';
        const author = message.author;
        const authorId = ChatGPT.generateAuthorString(author);

        if (ChatGPT.isDM(message)) {
            text += `Direct message from ${authorId}:`;
        } else {
            text += `Public chat message from ${authorId} in #${(message.channel as TextChannel).name}:`;
        }

        if (isSysPrompt && args.length === 1) {
            reactFail(message, 'System prompt not supplied.');
            this.processNext();
            return;
        }

        text += '\n\n' + message.cleanContent.substring(2 + this.trigger.length);

        const referenceMessageId = message.reference?.messageId;

        const links = Array.from(text.matchAll(this.linkPattern), (match) => match[0].trim());

        let embedContent = '';

        if (referenceMessageId) {
            // possibly a reply
            const replyMessage = await message.channel.messages.fetch(referenceMessageId);
            if (replyMessage.author.id != botUser.id) {
                // include the reply only if not replying to the bot itself
                text += `\n\nMessage content end. The above message is a reply to this message from ${ChatGPT.generateAuthorString(replyMessage.author)}:`;
                text += '\n\n' + replyMessage.cleanContent;

                // include attachment URLs which could be images from the message replied to
                // and embed data.
                replyMessage.attachments.forEach((attachment) => links.push(attachment.url));
                const replyEmbedParseResults = this.parseEmbeds(replyMessage.embeds);
                replyEmbedParseResults.forEach((result) => {
                    embedContent += (embedContent.length > 0 ? '\n\n' : '') + result.text;
                    result.urls.forEach((url) => {
                        links.push(url);
                    });
                });
            }
        }

        // include attachment URLs which could be images in the original image
        // and embed data.
        message.attachments.forEach((attachment) => links.push(attachment.url));
        const embedParseResults = this.parseEmbeds(message.embeds);
        embedParseResults.forEach((result) => {
            embedContent += (embedContent.length > 0 ? '\n\n' : '') + result.text;
            result.urls.forEach((url) => {
                links.push(url);
            });
        });

        const parseRequests = links.map((url: string) => ChatGPT.parseUrl(url));
        const parsedLinks = (await Promise.all(parseRequests)).filter((result) => result != null);

        const htmlLinks = parsedLinks.filter((l) => l.type === URLType.HTML);
        if (htmlLinks.length) {
            text += '\n\nLinks in the messages:\n\n```json\n';
            // omit "type" field from output
            text += JSON.stringify(htmlLinks.map(({type, ...rest}) => rest));
            text += '```';
        }

        if (embedContent.length) {
            text += '\n\n' + '```md\n#Embed content:\n';
            text += embedContent;
            text += '```';
        }

        const content: (ResponseInputText | ResponseInputImage)[] = [
            {
                type: 'input_text',
                // for system prompts, send as is
                text: isSysPrompt ? args.slice(1).join(' ') : text,
            }
        ];

        parsedLinks.filter((link) => link.type === URLType.Image).forEach((imageLink) => {
            content.push({
                type: 'input_image',
                image_url: imageLink.url,
                detail: 'auto',
            });
        });

        const options: ResponseCreateParamsNonStreaming = {
            model: this.model,
            instructions,
            input: [{
                role: isSysPrompt ? 'system' : 'user',
                content,
            }],
            max_output_tokens: 450, // limit to, approximately, the discord message limit
        };

        if (previousResponseEntry) {
            options['previous_response_id'] = previousResponseEntry.previous_response_id;
        }

        const response = await this.openAIClient.responses.create(options);

        await this.createEntry(ctx.knex, id, response.id, Boolean(previousResponseEntry));

        await ctx.msg.reply(response.output_text.substring(0, 1999));

        this.tokenCost.set(id, response.usage);

        this.processNext();
    }

    public async sendHelp(msg: Message): Promise<void> {
        let description: string = 'Utilizes ChatGPT for interactive replies.\n\n';
        description += 'General usage - `!g <some prompt>`. Subcommands are also available. ';
        description += 'It\'s recommended to `!g reset` when the converation has reached ~25k tokens ';
        description += 'to reduce weird bot behaviors like generating multiple "assistant" outputs.';

        let resetExplanation: string = 'Reset the converation based on generated summary. ';
        resetExplanation += 'Useful to keep token cost in check for long-term conversations. ';
        resetExplanation += 'If resetting a public, non-DM conversation, user\'s ID must be in `DISCORD_BOT_OPENAI_SYS_USERIDS`.';

        (msg.channel as TextChannel).send(buildHelp({
            title: this.trigger,
            description,
            commands: [
                {
                    command: `${this.trigger} tokens`,
                    explanation: 'Send the token cost breakdown for the last prompt.',
                },
                {
                    command: `${this.trigger} sys <prompt>`,
                    explanation: 'Send privileged `system` role prompt. User\'s ID must be in `DISCORD_BOT_OPENAI_SYS_USERIDS`.',
                },
                {
                    command: `${this.trigger} reset`,
                    explanation: resetExplanation,
                },
            ],
        }));
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
    ): Promise<PreviousResponseId | undefined> {
        const [result] = await knex
            .select('previous_response_id')
            .from<ChatGPTPreviousResponse>(this.table)
            .where('entity_id', entityId)
            .limit(1) as ChatGPTPreviousResponse[];
        return result;
    }

    private parseEmbeds(embeds: Embed[]): EmbedParseResult[] {
        return embeds.map((embed: Embed) => {
            let text = '';
            text += embed.title;
            text += '\n\n'+ embed.description;

            const footerText = embed.footer?.text || '';
            if (footerText.length) {
                text += '\n\n'+ footerText;
            }

            text += '\n\n' + embed.fields.map((field: APIEmbedField) => {
                return field.name + '\n' + field.value;
            }).reduce((acc, curr) => acc + '\n\n' + curr, '');

            return {
                text,
                urls: Array.from(text.matchAll(this.linkPattern), (match) => match[0].trim()),
            } as EmbedParseResult;
        }).flat();
    }

    // summarize existing conversation and use that summary to initiate a new one.
    private async performReset(
        knex: Knex,
        id: string,
        message: Message,
        previousResponseId: string,
        instructions: string
    ): Promise<void> {
        if (!this.openAIClient) {
            return;
        }

        const channel: TextChannel = message.channel as TextChannel;

        await channel.send('Summarizing.');

        const options: ResponseCreateParamsNonStreaming = {
            model: this.model,
            input: [{
                role: 'system',
                content: summaryPrompt,
            }],
            previous_response_id: previousResponseId,
        };

        channel.sendTyping();
        const response = await this.openAIClient.responses.create(options);

        await channel.send('Done. Initiating new conversation.');

        const content: string = 'This summary describes the conversation so far:\n\n' + response.output_text;
        const newOptions: ResponseCreateParamsNonStreaming = {
            model: this.model,
            instructions,
            input: [
                {
                    role: 'system',
                    content,
                },
                {
                    role: 'user',
                    content: 'Say hi and summarize where we last left off.',
                },
            ],
        };

        channel.sendTyping();
        const newResponse = await this.openAIClient.responses.create(newOptions);

        await this.createEntry(knex, id, newResponse.id, true);
        this.tokenCost.set(id, newResponse.usage);

        await reactSuccess(message, newResponse.output_text);

        this.processNext();
    }

    private async processNext(): Promise<void> {
        this.isProcessing = false;
        if (this.processingQueue.length) {
            this.exec(this.processingQueue.shift() as ExecContext);
        }
    }

    static shouldLoad(): boolean {
        return !!process.env.DISCORD_BOT_OPENAI_API_KEY;
    }

    private static async parseUrl(url: string): Promise<URLCrawlResult | null> {
        let response: Response;

        try {
            response = await fetch(url.trim());
        } catch {
            return null;
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        if (!contentType.startsWith('text/html')) {
            const imageContentTypeCat = 'image/';
            if (contentType.startsWith(imageContentTypeCat)) {
                const imageType = contentType.slice(imageContentTypeCat.length);
                // types supported by chatGPT.
                if (['png', 'jpeg', 'webp', 'gif'].some((i) => imageType === i)) {
                    return {
                        url,
                        type: URLType.Image,
                    };
                }
                return null;
            }
            return null;
        }

        let textContent: string;
        try {
            textContent = await response.text();
        } catch {
            return null;
        }

        const c = cheerio.load(textContent);

        // assume that if title open graph tag exists, description does as well
        let title = c(ChatGPT.getOGTagParam('title')).attr('content');

        if (!title) {
            title = c('title').text();
        }

        // prefer regular description meta tag instead of OG, since that isn't trimmed
        let description = c('meta[name=description]').attr('content');
        if (!description) {
            description = c(ChatGPT.getOGTagParam('description')).attr('content') || '';
        }

        // first 10 paragraphs limited to 1000 chars
        const p = c('p').slice(0, 10);
        const paragraphs = Array.from(
            p,
            ((_, i) => p.eq(i).text())
        ).join(' ').trim().slice(0, 1500);

        return {
            type: URLType.HTML,
            url,
            title,
            description,
            paragraphs,
        };
    }

    private static getOGTagParam(tag: string): string {
        return `meta[property=og:${tag}]`;
    }

    private static isDM(msg: Message): boolean {
        return !msg.guild;
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
        return `${author.displayName}, ID ${author.id}`;
    }
}

import OpenAI from "openai";
import fs from 'fs';
import { Knex } from 'knex';
import * as cheerio from 'cheerio';
import { Message, TextChannel, User } from 'discord.js';
import Command, { ExecContext } from '../base';
import { buildHelp } from '../../utils/help';
import { ResponseCreateParamsNonStreaming, ResponseInputImage, ResponseInputText } from 'openai/resources/responses/responses';
import { PluginInitOptions } from '../../core/plugins';
import { ChatGPTPreviousResponse } from '../../models';
import URLCrawlResult, { URLType } from './url-crawl-result';
import supplementaryInstructions from './supplementary-instructions';

export default class ChatGPT extends Command {
    public readonly trigger: string = 'ai';
    public readonly table: string = 'chatgpt';

    private readonly model: string = process.env.DISCORD_BOT_OPENAI_MODEL || '';
    private readonly openAIClient?: OpenAI;
    private readonly instructions: string = '';
    private readonly linkPattern: RegExp = /<?(https?:\/\/.+?)>?(\s|$)/gm;
    private readonly processingQueue: ExecContext[] = [];
    private isProcessing: boolean = false;

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
        if (this.isProcessing) {
            this.processingQueue.push(ctx);
            return;
        }

        // process messages one by one to keep the conversation threads linear.
        this.isProcessing = true;

        if (!this.openAIClient) {
            this.isProcessing = false;
            return;
        }

        const message = ctx.msg;

        if (!ctx.args.length) {
            this.sendHelp(message);
            this.isProcessing = false;
            return;
        }

        let instructions = this.instructions;
        instructions += supplementaryInstructions;
        instructions += `\n\nYour nickname is ${message.client.user.displayName}.`;

        const id = ChatGPT.createId(ctx.msg);
        const previousResponseEntry: { previous_response_id: string } | undefined = await this.getPreviousResponseId(ctx.knex, id);

        let text = '';
        const author = message.author;
        const authorId = ChatGPT.generateAuthorString(author);

        if (ChatGPT.isDM(message)) {
            text += `Direct message from ${authorId}:`;
        } else {
            text += `Public chat message from ${authorId}:`;
        }

        text += '\n\n' + message.cleanContent.substring(2 + this.trigger.length);

        const referenceMessageId = message .reference?.messageId;

        const links = Array.from(text.matchAll(this.linkPattern), (match) => match[0].trim());

        if (referenceMessageId) {
            // possibly a reply
            const replyMessage = await message.channel.messages.fetch(referenceMessageId);
            text += `\n\nMessage content end. The above message is a reply to this message from ${ChatGPT.generateAuthorString(replyMessage.author)}:`;
            text += '\n\n' + replyMessage.cleanContent;

            // include attachment URLs which could be images from the message replied to
            replyMessage.attachments.forEach((attachment) => links.push(attachment.url));
        }

        // include attachment URLs which could be images in the original image
        ctx.msg.attachments.forEach((attachment) => links.push(attachment.url));

        const parseRequests = links.map((url: string) => ChatGPT.parseUrl(url));
        const parsedLinks = (await Promise.all(parseRequests)).filter((result) => result != null);

        const htmlLinks = parsedLinks.filter((l) => l.type === URLType.HTML);
        if (htmlLinks.length) {
            text += '\n\nLinks in the messages:\n\n```json\n';
            // omit "type" field from output
            text += JSON.stringify(htmlLinks.map(({type, ...rest}) => rest));
            text += '```';
        }

        const content: (ResponseInputText | ResponseInputImage)[] = [
            {
                type: 'input_text',
                text,
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
                role: 'user',
                content,
            }],
        };

        if (previousResponseEntry) {
            options['previous_response_id'] = previousResponseEntry.previous_response_id;
        }

        const response = await this.openAIClient.responses.create(options);

        await this.createEntry(ctx.knex, id, response.id, Boolean(previousResponseEntry));

        await ctx.msg.reply(response.output_text);

        this.isProcessing = false;

        if (this.processingQueue.length) {
            this.exec(this.processingQueue.shift() as ExecContext);
        }
    }

    public async sendHelp(msg: Message): Promise<void> {
        if (msg.channel.isTextBased()) {
            (msg.channel as TextChannel).send(buildHelp({
                title: this.trigger,
                description: 'Utilizes ChatGPT for interactive replies.\n\nUsage - `!ai <some prompt>`',
            }));
        }
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
    ): Promise<{ previous_response_id: string } | undefined> {
        const [result] = await knex
            .select('previous_response_id')
            .from<ChatGPTPreviousResponse>(this.table)
            .where('entity_id', entityId)
            .limit(1) as ChatGPTPreviousResponse[];
        return result;
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

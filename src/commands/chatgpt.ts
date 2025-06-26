import { Message, TextChannel } from 'discord.js';
import Command, { ExecContext } from './base';
import { buildHelp } from '../utils/help';
import OpenAI from "openai";
import { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';

export default class ChatGPT extends Command {
    public readonly trigger: string = 'grok';

    private previousResponseId: string = "";
    private readonly personality = process.env.DISCORD_BOT_OPENAI_PERSONALITY;
    private readonly model = process.env.DISCORD_BOT_OPENAI_MODEL;
    private readonly maxLen = parseInt(process.env.DISCORD_BOT_OPENAI_MAX_CHARS || '400');
    private readonly openAIClient = new OpenAI({apiKey: process.env.DISCORD_BOT_OPENAI_API_KEY});
    private readonly instructions = `You are a chat bot responding to user prompts. The response should be at most ${this.maxLen} characters long with a personality summarized as - ${this.personality}.`; 

    public async exec(ctx: ExecContext): Promise<void> {
        if (!ctx.args.length) {
            this.sendHelp(ctx.msg);
            return;
        }

        const input = ctx.args.join(' ');

        const options: ResponseCreateParamsNonStreaming = {
            model: this.model,
            instructions: this.instructions,
            input
        };

        if (this.previousResponseId.length) {
            options['previous_response_id'] = this.previousResponseId;
        }

        const response = await this.openAIClient.responses.create(options);

        this.previousResponseId = response.id;

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
}

import { env } from 'process';
import { Message } from 'discord.js';

/**
 * Utilities specific to the bot itself.
 */

/**
 * Return configured bot command prefix.
 */
export function getPrefix(): string {
    return env.DISCORD_BOT_PREFIX || '!';
}

/**
 * Splits a Discord message into a command and arguments.
 */
export function splitMessage(msg: { content: string }): { command: string; args: string[] } {
    const tokens: string[] = msg.content.slice(getPrefix().length).split(' ');
    return {
        command: tokens[0],
        args: tokens.slice(1),
    };
}

/**
 * Get all cached messages which aren't bot
 * commands and aren't from the bot itself.
 */
export async function getRegularMessages(msg: Message): Promise<Message[]> {
    return msg.channel.messages.filter(
        (message) => !message.content.startsWith(getPrefix()) && !message.author.bot,
    ).array();
}

/**
 * Get the last message which isn't a bot
 * command and isn't from the bot itself.
 */
export async function getNewestRegularMessage(msg: Message): Promise<Message | undefined> {
    const messages = await getRegularMessages(msg);
    return messages[messages.length - 1];
}

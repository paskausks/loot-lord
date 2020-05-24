import { env } from 'process';

/**
 * Utilities specific to the bot itself.
 */

/**
 * Return configured bot command prefix.
 */
export const getPrefix = (): string => env.DISCORD_BOT_PREFIX || '!';

/**
 * Splits a Discord message into a command and arguments.
 */
export const splitMessage = (msg: { content: string }): { command: string; args: string[] } => {
    const tokens: string[] = msg.content.slice(getPrefix().length).split(' ');
    return {
        command: tokens[0],
        args: tokens.slice(1),
    };
};

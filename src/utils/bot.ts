import { env } from 'process';

/**
 * Utilities specific to the bot itself
 */

/**
 * Return configured bot command prefix.
 */
// eslint-disable-next-line import/prefer-default-export
export const getPrefix = (): string => env.DISCORD_BOT_PREFIX || '!';

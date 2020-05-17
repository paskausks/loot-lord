import { env } from 'process';

/*
 * Temporary dumping ground for miscallenous utilities.
 */

// eslint-disable-next-line import/prefer-default-export
export const getPrefix = (): string => env.DISCORD_BOT_PREFIX || '!';

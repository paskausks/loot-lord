import dotenv from 'dotenv';
import { env, exit } from 'process';
import logger from 'signale';
import { bootstrap } from './core';

/**
 * Main bot entrypoint.
 */

dotenv.config();
const token: string | undefined = env.DISCORD_BOT_TOKEN;

if (!token) {
    logger.error(
        'Bot token missing. Is there a ".env" file with a DISCORD_BOT_TOKEN defined?',
    );
    exit(1);
}

bootstrap().then((client) => {
    client.login(token);
});

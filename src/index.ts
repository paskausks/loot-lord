import knex from 'knex';
import dotenv from 'dotenv';
import { env, exit } from 'process';
import Discord from 'discord.js';
import logger from 'signale';

const main = async (): Promise<void> => {
    dotenv.config();
    const prefix: string | undefined = env.DISCORD_BOT_PREFIX;
    const token: string | undefined = env.DISCORD_BOT_TOKEN;

    if (!prefix || !token) {
        logger.error('Environment variables missing. Does ".env" Have the correct values?');
        exit(1);
    }

    // Establish database connection
    const cnx = knex({
        client: 'sqlite3',
        connection: {
            filename: './data.sqlite3',
        },
        useNullAsDefault: true,
    });

    // Establish Discord connection
    const client = new Discord.Client();

    client.on('ready', () => {
        logger.success(`Logged in as ${client.user.tag}!`);
    });

    client.on('message', (msg: Discord.Message): void => {
        if (!msg.content.startsWith(prefix) || msg.author.bot) {
            return;
        }

        let tokens: string[] = msg.content.slice(prefix.length).split(' ');
        let command: string = tokens[0];
        const args = tokens.slice(1);

        msg.channel.send(`Command sent: ${command}\n\nArgs are: ${args.join(',')}`);
    });

    client.login(token);
};

main().then(() => {
    logger.log('done running');
});

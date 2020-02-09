import knex from 'knex';
import dotenv from 'dotenv';
import { env, exit } from 'process';
import { fromEvent, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import Discord from 'discord.js';
import logger from 'signale';
import commands from './commands';
import { SimpleCommand } from './models';

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

    const newMessage = (fromEvent(client, 'message') as Observable<Discord.Message>).pipe(
        filter((msg) => msg.content.startsWith(prefix) && !msg.author.bot),
        filter((msg) => msg.content.length > prefix.length),
    );

    newMessage.subscribe(async (msg) => {
        const tokens: string[] = msg.content.slice(prefix.length).split(' ');
        const command: string = tokens[0];
        const args: string[] = tokens.slice(1);

        logger.info(`Received command "${command}" from ${msg.author.tag}`);

        const commandExecutor = commands[command];

        // Built in command found.
        if (commandExecutor) {
            await commandExecutor.exec({
                msg,
                knex: cnx,
                args,
            });
            return;
        }

        // Try simple commands
        const [simpleCommand] = await cnx.select('command', 'response')
            .from<SimpleCommand>('simplecommands')
            .where('command', command)
            .limit(1);

        if (!simpleCommand) {
            const simpleCommands = await cnx.select('command')
                .from<SimpleCommand>('simplecommands');

            const commandList = Object.keys(commands)
                .concat(simpleCommands.map((cmd) => cmd.command));

            await msg.channel.send(
                `Unrecognized command. Try one of these: ${commandList.map(
                    (v) => `\`${prefix}${v}\``,
                ).join(', ')}.`,
            );
            return;
        }

        await msg.channel.send(simpleCommand.response);
    }, undefined, () => logger.log('complete'));

    client.login(token);
};

main();

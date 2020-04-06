import knex from 'knex';
import dotenv from 'dotenv';
import { env, exit } from 'process';
import { fromEvent, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import Discord from 'discord.js';
import logger from 'signale';
import commands from './commands';
import SimpleCommand from './commands/simple-command';

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
            timezone: 'UTC',
        },
        useNullAsDefault: true,
    });

    // Establish Discord connection
    const client = new Discord.Client();

    client.on('ready', () => {
        logger.success(`Logged in as ${client.user.tag}!`);
    });

    // Hook update command to be called once a minute.
    const commandInstances = Object.values(commands);
    const updateContext = {
        knex: cnx,
        discord: client,
    };
    setInterval(() => {
        Promise.all(commandInstances.map((c) => c.update(updateContext))).then(() => {
            logger.info('Update cycle done.');
        });
    }, 60 * 1000);

    const newMessage = (fromEvent(client, 'message') as Observable<Discord.Message>).pipe(
        // TODO: Remove check if it starts with prefix to allow for
        // random responses, counters, etc.
        filter((msg) => msg.content.startsWith(prefix) && !msg.author.bot),
        filter((msg) => msg.content.length > prefix.length),
    );

    newMessage.subscribe(async (msg) => {
        const tokens: string[] = msg.content.slice(prefix.length).split(' ');
        const command: string = tokens[0];
        const args: string[] = tokens.slice(1);

        logger.info(
            `Rcvd cmd "${command}" from ${msg.author.tag}`
            + ` on "${msg.guild.name}", #${(msg.channel as Discord.TextChannel).name}.`
            + ` Args: ${JSON.stringify(args)}`,
        );

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
        const simpleCommandDirectory = (commands.command as SimpleCommand);
        const simpleCommand = await simpleCommandDirectory.getCommand(cnx, command, ['command', 'response']);

        if (!simpleCommand) {
            // No matching command found.
            // Create a list of builtins and custom commands.
            const simpleCommands = await simpleCommandDirectory.getAll(cnx);
            const commandList = Object.keys(commands)
                .concat(simpleCommands.map((cmd) => cmd.command));

            await msg.channel.send(
                `Unrecognized command. Try one of these: ${commandList.map(
                    (v) => `\`${prefix}${v}\``,
                ).join(', ')}.`,
            );
            return;
        }

        await msg.channel.send(simpleCommandDirectory.parseCommand(simpleCommand, msg).response);
    }, undefined, () => logger.log('complete'));

    client.login(token);
};

main();

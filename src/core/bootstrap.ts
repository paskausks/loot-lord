import knex from 'knex';
import Discord from 'discord.js';
import commands from '../commands';
import SimpleCommand from '../commands/simple-command';
import { getPrefix } from '../utils/bot';
import { botCommandMessage } from './observables';
import initPlugins, { PluginConstructor } from './plugins';

/**
 * Connect to the database,
 * register middlewares and event
 * handlers.
 */
async function bootstrap(plugins: PluginConstructor[] = []): Promise<Discord.Client> {
    // Establish database connection
    const cnx = knex({
        client: 'sqlite3',
        connection: {
            filename: './data.sqlite3',
            timezone: 'UTC',
        },
        useNullAsDefault: true,
    });

    const client = new Discord.Client();

    initPlugins({
        knex: cnx,
        client,
    }, plugins);

    const commandInstances = commands.values();
    const updateContext = {
        knex: cnx,
        discord: client,
    };
    setInterval(() => {
        Promise.all(Array.from(commandInstances).map((c) => c.update(updateContext)));
    }, 30 * 1000);

    const prefix: string = getPrefix();

    botCommandMessage(client).subscribe(async (commandMessage) => {
        const { message, command, args } = commandMessage;
        const commandExecutor = commands.get(command);

        // Built in command found.
        if (commandExecutor) {
            await commandExecutor.exec({
                msg: message,
                knex: cnx,
                args,
            });
            return;
        }

        // Try simple commands
        const simpleCommandDirectory = (commands.get('command') as SimpleCommand);
        const simpleCommand = await simpleCommandDirectory.getCommand(cnx, command, ['command', 'response']);

        if (!simpleCommand) {
            // No matching command found.
            // Create a list of builtins and custom commands.
            const simpleCommands = await simpleCommandDirectory.getAll(cnx);
            const commandList = Object.keys(commands)
                .concat(simpleCommands.map((cmd) => cmd.command));

            await message.channel.send(
                `Unrecognized command. Try one of these: ${commandList.map(
                    (v) => `\`${prefix}${v}\``,
                ).join(', ')}.`,
            );
            return;
        }

        await message.channel.send(
            simpleCommandDirectory.parseCommand(simpleCommand, message).response,
        );
    });

    return client;
}

export default bootstrap;

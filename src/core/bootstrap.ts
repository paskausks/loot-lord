import knex from 'knex';
import Discord from 'discord.js';
import commands from '../commands';
import initPlugins, { PluginConstructor, systemPlugins } from './plugins';

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
    }, [...systemPlugins, ...commands, ...plugins]);

    return client;
}

export default bootstrap;

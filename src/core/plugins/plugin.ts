import knex from 'knex';
import { Client } from 'discord.js';
import { Subject } from 'rxjs';
import {
    BotCommandMessageObservable,
    MessageObservable,
    ClientObservable,
    SubjectMap,
} from '../observables';
import LoggerMessage, { LOGGER_SUBJECT_KEY, levels } from './logger/message'; // Prevent circular import

/**
 * Initialization options for a plugin
 */
export interface PluginInitOptions {
    knex: knex;
    client: Client;
    ready: ClientObservable;
    allMessages: MessageObservable;
    commandMessages: BotCommandMessageObservable;
    plugins: SubjectMap;
}

/**
 * An interface describing the plugin constructor
 */
export interface PluginConstructor {
  new (options: PluginInitOptions): Plugin;
}

/**
 * Main base class for plugins.
 */
abstract class Plugin {
    private readonly plugins: SubjectMap;

    constructor(options: PluginInitOptions) {
        // The logger plugin has to be loaded first, otherwise
        // plugins won't be able to publish to the logger.
        this.plugins = options.plugins;
    }

    /**
     * Dispatch log to logger plugin for output.
     */
    log(message: string, level: levels = 'info') {
        this.dispatch<LoggerMessage>(LOGGER_SUBJECT_KEY, { message, level });
    }

    /**
     * Dispatch a message to a plugin.
     */
    private dispatch<T>(destinationKey: string, message: T) {
        const plugin = this.plugins.get(destinationKey) as Subject<T>;

        if (!plugin) {
            throw new Error(`Plugin Subject with key ${destinationKey} not found!`);
        }

        plugin.next(message);
    }
}

export default Plugin;

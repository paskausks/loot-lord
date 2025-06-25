import { Knex } from 'knex';
import { Client } from 'discord.js';
import { Subject } from 'rxjs';
import {
    BotCommandMessageObservable,
    MessageObservable,
    ClientObservable,
    ReactionAddObservable,
    SubjectMap,
} from '../observables';
import LoggerMessage, { LOGGER_SUBJECT_KEY, levels } from './logger/message'; // Prevent circular import

/**
 * Initialization options for a plugin
 */
interface PluginInitOptions {
    knex: Knex;
    client: Client;
    ready: ClientObservable;
    allMessages: MessageObservable;
    commandMessages: BotCommandMessageObservable;
    addedReactions: ReactionAddObservable;
    plugins: SubjectMap;
}

/**
 * Main base class for plugins.
 */
class Plugin {
    private readonly plugins: SubjectMap;

    constructor(options: PluginInitOptions) {
        // The logger plugin has to be loaded first, otherwise
        // plugins won't be able to publish to the logger.
        this.plugins = options.plugins;
    }

    /**
     * Dispatch log to logger plugin for output.
     */
    log(message: string, level: levels = 'info'): void {
        this.dispatch<LoggerMessage>(LOGGER_SUBJECT_KEY, { message, level });
    }

    /**
     * Dispatch a message to a plugin.
     */
    protected dispatch<T>(destinationKey: string, message: T): void {
        const plugin = this.plugins.get(destinationKey) as Subject<T>;

        if (!plugin) {
            throw new Error(`Plugin Subject with key ${destinationKey} not found!`);
        }

        plugin.next(message);
    }

    /**
     * Return loaded plugins.
     */
    protected getPlugins(): string[] {
        return Array.from(this.plugins.keys());
    }

    static create(options: PluginInitOptions): Plugin {
        return new this(options);
    }
}

/**
 * An interface describing the plugin constructor
 */
interface PluginConstructor {
  new (options: PluginInitOptions): Plugin;
  create (options: PluginInitOptions): Plugin;
}

export {
    Plugin as default,
    PluginInitOptions,
    PluginConstructor,
};

import Plugin, { PluginInitOptions, PluginConstructor } from './plugin';
import {
    ready,
    rawMessage,
    botCommandMessage,
    reactionAdd,
    SubjectMap,
} from '../observables';
import Logger from './logger';
import Pulse from './pulse';
import CommandDispatcher from './command-dispatcher';

type PluginArray = PluginConstructor[];
type PluginInitDependencies = 'client' | 'knex';

/**
 * An array of built-in plugins.
 */
const systemPlugins: PluginArray = [
    Logger,
    Pulse,
    CommandDispatcher,
];

/**
 * Initializes the built-in plugins together with the
 * supplied plugins.
 */
export const initPlugins = (
    dependencies: Pick<PluginInitOptions, PluginInitDependencies>,
    additional: PluginArray = [],
): Plugin[] => {
    const { client } = dependencies;
    const initOptions: PluginInitOptions = {
        ready: ready(client),
        allMessages: rawMessage(client),
        commandMessages: botCommandMessage(client),
        addedReactions: reactionAdd(client),
        plugins: new Map() as SubjectMap,
        ...dependencies,
    };

    return systemPlugins.concat(additional).map(
        (PluginCls) => PluginCls.create({
            ...dependencies,
            ...initOptions,
        } as PluginInitOptions),
    );
};

export default initPlugins;

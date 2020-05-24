import Plugin, { PluginInitOptions, PluginConstructor } from './plugin';
import {
    ready,
    rawMessage,
    botCommandMessage,
    SubjectMap,
} from '../observables';
import Logger from './logger';

type PluginArray = PluginConstructor[];
type PluginInitDependencies = 'client' | 'knex';

/**
 * An array of built in plugins.
 */
const systemPlugins: PluginArray = [
    Logger,
];

/**
 * Initializes the given plugins together with the
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
        plugins: new Map() as SubjectMap,
        ...dependencies,
    };

    return systemPlugins.concat(additional).map(
        (PluginCls) => new PluginCls({
            ...dependencies,
            ...initOptions,
        } as PluginInitOptions),
    );
};

export default initPlugins;

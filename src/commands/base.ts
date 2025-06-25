import { Message, TextChannel } from 'discord.js';
import { Subject } from 'rxjs';
import { Knex } from 'knex';
import { Plugin, PluginInitOptions } from '../core/plugins';

export const COMMAND_PLUGIN_PREFIX = 'commands/';
export const HELP_POSTFIX = '/?';

export interface ExecContext {
    msg: Message;
    knex: Knex;
    args: string[];
}

/**
 * Base class for plugins which can respond directly
 * to text triggers aka. commands.
 */
export default class Command extends Plugin {
    readonly trigger: string = '';

    protected async exec(_ctx: ExecContext): Promise<void> { throw new Error('Not implemented!'); }
    protected async sendHelp(msg: Message): Promise<void> { (msg.channel as TextChannel).send('Help not available!'); }
    protected getCommands(): string[] {
        return this.getPlugins().filter(
            (val: string) => val.startsWith(COMMAND_PLUGIN_PREFIX) && val.endsWith(HELP_POSTFIX),
        ).map((val): string => val.replace(COMMAND_PLUGIN_PREFIX, '').replace(HELP_POSTFIX, ''));
    }

    /**
     * Register self as a subject and subscribe to it
     * so commands from the command executor can be received.
     * Also register a subject for help responses.
     */
    static create(options: PluginInitOptions): Plugin {
        const instance = new this(options);
        const path = `${COMMAND_PLUGIN_PREFIX}${instance.trigger}`;
        const execSubject: Subject<ExecContext> = new Subject();
        const helpSubject: Subject<Message> = new Subject();

        options.plugins.set(path, execSubject);
        options.plugins.set(`${path}${HELP_POSTFIX}`, helpSubject);

        execSubject.subscribe(instance.exec.bind(instance));
        helpSubject.subscribe(instance.sendHelp.bind(instance));

        return instance;
    }
}

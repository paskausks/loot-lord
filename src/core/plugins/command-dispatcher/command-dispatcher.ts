import { PluginInitOptions, Plugin } from '..';
import { HELP_POSTFIX, COMMAND_PLUGIN_PREFIX, ExecContext } from '../../../commands/base';
import { COMMAND_DISPATCHER_SUBJECT, CommandDispatcherMessage } from './message';

/**
 * Forward messages to commands.
 */
class CommandDispatcher extends Plugin {
    constructor(options: PluginInitOptions) {
        super(options);

        const { knex, commandMessages } = options;

        commandMessages.subscribe(async (commandMessage) => {
            const { message, command, args } = commandMessage;
            const targetCommand = this.getPlugins()
                .filter((v) => !v.endsWith(HELP_POSTFIX))
                .find((v) => v === `${COMMAND_PLUGIN_PREFIX}${command}`);

            // Built in command found.
            if (targetCommand) {
                this.dispatch<ExecContext>(targetCommand, {
                    msg: message,
                    knex,
                    args,
                });
                return;
            }

            // Pass it on to the simple command handler
            this.dispatch<CommandDispatcherMessage>(COMMAND_DISPATCHER_SUBJECT, {
                message,
                knex,
                command,
            });
        });
    }
}

export default CommandDispatcher;

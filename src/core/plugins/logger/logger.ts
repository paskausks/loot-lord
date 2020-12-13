import { TextChannel } from 'discord.js';
import signale from 'signale';
import { Subject } from 'rxjs';
import { PluginInitOptions, Plugin } from '..';
import { LoggerMessage, LOGGER_SUBJECT_KEY } from '.';

class Logger extends Plugin {
    constructor(options: PluginInitOptions) {
        super(options);

        // Log on connection
        options.ready.subscribe((client) => signale.success(`Logged in as ${client.user?.tag}!`));

        // Log on valid bot command
        options.commandMessages.subscribe(({ message, command, args }) => {
            const commandInfo = `${command} ${args.join(' ')}`.trim();

            let messageInfo = 'via direct message';
            if (message.guild) {
                // Command received from server.
                messageInfo = `on ${message.guild.name}, #${(message.channel as TextChannel).name}`;
            }

            signale.info(
                `Rcvd cmd "${commandInfo}" from ${message.author.tag} `
                + `${messageInfo}.`,
            );
        });

        // Expose logger subject and subscribe to it.
        const subject: Subject<LoggerMessage> = new Subject();
        options.plugins.set(LOGGER_SUBJECT_KEY, subject);
        subject.subscribe((loggerMessage) => signale[loggerMessage.level || 'info'](loggerMessage.message));
    }
}

export default Logger;

import Knex from 'knex';
import Discord from 'discord.js';
import { Subject } from 'rxjs';
import Command, { ExecContext } from './base';
import { SimpleCommand as SimpleCommandModel } from '../models';
import {
    reactSuccess as success,
    reactFail as fail,
    getMoment,
    getNickname,
} from '../utils/discord';
import { buildHelp } from '../utils/help';
import { PluginInitOptions } from '../core/plugins';
import { getPrefix } from '../utils/bot';
import { COMMAND_DISPATCHER_SUBJECT, CommandDispatcherMessage } from '../core/plugins/command-dispatcher/message';


interface KeyMap {
    [key: string]: (message: Discord.Message) => string;
}

const keywordKeyMap: KeyMap = {
    year: () => `${new Date().getFullYear()}`,
    percentage: () => `${Math.round(Math.random() * 100)}%`,
    self: (message: Discord.Message) => `<@${message.author.id}>`,
    random: (message: Discord.Message) => {
        const users = message.client.users
            .array()
            .filter((user) => user.id !== '1') || [];
        if (!users.length) {
            return '';
        }
        const index = Math.floor(Math.random() * users.length);
        return `<@${users[index].id}>`;
    },
    arg: (message: Discord.Message) => message.content.split(' ').splice(1).join(' '),
};

export default class SimpleCommand extends Command {
    public readonly trigger: string = 'command';
    private table: string = 'simplecommands';

    constructor(options: PluginInitOptions) {
        super(options);

        // Register a custom Subject for CommandDispatcher
        const subj: Subject<CommandDispatcherMessage> = new Subject();
        options.plugins.set(COMMAND_DISPATCHER_SUBJECT, subj);
        subj.subscribe(this.handleCommandRequest.bind(this));
    }

    public async exec(ctx: ExecContext) {
        const [subCommand, ...args] = ctx.args;
        const validSubCommands = ['`add`', '`rm`', '`info`', '`list`', 'help'].join(
            ', ',
        );

        const { msg, knex } = ctx;

        if (!ctx.args.length) {
            this.sendHelp(msg);
            return;
        }

        // FIXME: Extract into separate methods to save indent.
        switch (subCommand) {
        case 'list': {
            const all = await this.getAll(ctx.knex);

            if (!all.length) {
                msg.channel.send('No custom commands created.');
                return;
            }

            msg.channel.send(
                `Currently saved commands: ${all
                    .map((cmd) => `\`${cmd.command}\``)
                    .join(', ')}`,
            );
            break;
        }
        case 'info': {
            const [commandQuery] = args;

            if (!commandQuery) {
                fail(msg, 'You have to provide a command!');
                return;
            }

            const command = await this.getCommand(knex, commandQuery, [
                'created_by_id',
                'created_at',
            ]);

            if (!command) {
                msg.channel.send('This command does not exist.');
                return;
            }

            msg.channel.send(
                `Command '${commandQuery}' created at ${getMoment(
                    command.created_at,
                ).format('lll')}`
                    + ` by ${await getNickname(msg, command.created_by_id)}.`,
            );

            break;
        }
        case 'add': {
            const [command, ...responseSplit] = args;
            const response = responseSplit.join(' ');

            if (!command) {
                fail(msg, 'Provide a command name.');
                return;
            }

            if (this.getCommands().some((cmd) => command === cmd)) {
                fail(msg, 'This name is used by a built-in command.');
                return;
            }

            if (!response.length) {
                fail(msg, 'Provide a response.');
                return;
            }

            if (command.length > 50) {
                fail(
                    msg,
                    "The length of the command can't exceed 50 characters.",
                );
                return;
            }

            if (response.length > 1000) {
                fail(
                    msg,
                    "The length of the response can't exceed 1000 characters.",
                );
                return;
            }

            if (!/^[a-zA-Z0-9]+$/.test(command)) {
                fail(
                    msg,
                    'The command name can only contain letters and numbers',
                );
                return;
            }

            try {
                await knex(this.table).insert({
                    command,
                    response,
                    created_by_id: msg.author.id,
                });
            } catch (e) {
                if (e.errno && e.errno === 19) {
                    fail(msg, `The command '${command}' is already taken!`);
                    return;
                }

                fail(msg, 'Some unknown error occured.');
                return;
            }

            success(msg);
            return;
        }
        case 'rm': {
            const command = args[0];

            if (!command) {
                fail(msg, 'Missing command to remove.');
                return;
            }

            const rowsAffected = await knex(this.table)
                .where('command', command)
                .del();

            if (!rowsAffected) {
                fail(
                    msg,
                    `There doesn't seem to be a command called '${command}'.`,
                );
                return;
            }

            success(msg);
            return;
        }
        case 'help': {
            this.sendHelp(msg);
            break;
        }
        default:
            msg.channel.send(
                `Invalid subcommand. Try: ${validSubCommands}`,
            );
        }
    }

    /**
     * Handle CommandDispatcher requests, for when
     * a command in a message doesn't match built-ins.
     */
    private async handleCommandRequest(request: CommandDispatcherMessage) {
        // Try simple commands
        const { knex, command, message } = request;
        const simpleCommand = await this.getCommand(knex, command, ['command', 'response']);

        if (!simpleCommand) {
            // No matching command found.
            // Create a list of builtins and custom commands.
            const simpleCommands = await this.getAll(knex);
            const commandList = this.getCommands()
                .concat(simpleCommands.map((cmd) => cmd.command));

            fail(
                message,
                `Unrecognized command. Try one of these: ${commandList.map(
                    (v) => `\`${getPrefix()}${v}\``,
                ).join(', ')}.`,
            );
            return;
        }

        await message.channel.send(
            this.parseCommand(simpleCommand, message).response,
        );
    }

    public async sendHelp(msg: Discord.Message): Promise<void> {
        msg.channel.send(buildHelp({
            title: this.trigger,
            description: 'Create and manage custom commands with simple responses.',
            commands: [
                {
                    command: `${this.trigger} add <command> <some response text>`,
                    explanation: 'Add a new command. '
                    + 'Available template tags for responses: '
                    + `${Object.keys(keywordKeyMap).map((v) => `\`<${v}>\``).join(',')}`
                    + '.',
                },
                {
                    command: `${this.trigger} rm <command>`,
                    explanation: 'Remove a command.',
                },
                {
                    command: `${this.trigger} info <command>`,
                    explanation: 'Shows some basic information about the command.',
                },
                {
                    command: `${this.trigger} list`,
                    explanation: 'List all saved commands.',
                },
            ],
        }));
    }

    public async getCommand(
        knex: Knex,
        name: string,
        fields: string[] = ['command', 'response'],
    ): Promise<SimpleCommandModel | undefined> {
        const [result] = await knex
            .select(...fields)
            .from<SimpleCommand>('simplecommands')
            .where('command', name)
            .limit(1);
        return result;
    }

    public parseCommand(
        command: SimpleCommandModel,
        message: Discord.Message,
    ): SimpleCommandModel {
        // Parse command's response if it's using any keywords
        // and replace keyword with other data
        const { response } = command;
        const newResponse = response.replace(/<\w+>/gi, (match) => keywordKeyMap[match.slice(1, -1)](message));

        return { ...command, response: newResponse };
    }

    public async getAll(knex: Knex): Promise<Pick<SimpleCommandModel, 'command'>[]> {
        return knex
            .select('command')
            .from<SimpleCommandModel>('simplecommands');
    }
}

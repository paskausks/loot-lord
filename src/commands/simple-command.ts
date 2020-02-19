import Knex from 'knex';
import BaseCommand, { ExecContext } from './base';
import { SimpleCommand as SimpleCommandModel } from '../models';
import {
    reactSuccess as success,
    reactFail as fail,
    getMoment,
    getNickname,
} from '../utils';

export default class SimpleCommand implements BaseCommand {
    private table: string = 'simplecommands';

    public async exec(ctx: ExecContext) {
        const [subCommand, ...args] = ctx.args;
        const validSubCommands = [
            '`add`',
            '`rm`',
            '`info`',
            '`list`',
        ].join(', ');

        const { msg, knex } = ctx;

        if (!subCommand) {
            msg.channel.send(`Missing sub command, try: ${validSubCommands}!`);
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
                `Currently saved commands: ${all.map((cmd) => `\`${cmd.command}\``).join(', ')}`,
            );
            break;
        }
        case 'info': {
            const [commandQuery] = args;
            const command = await this.getCommand(knex, commandQuery, ['created_by_id', 'created_at']);

            if (!command) {
                msg.channel.send('This command does not exist.');
                return;
            }

            msg.channel.send(
                `Command "${commandQuery}" created at ${getMoment(command.created_at).format('lll')}`
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

            if (!response.length) {
                fail(msg, 'Provide a response.');
                return;
            }

            if (command.length > 50) {
                fail(msg, 'The length of the command can\'t exceed 50 characters.');
                return;
            }

            if (response.length > 1000) {
                fail(msg, 'The length of the response can\'t exceed 1000 characters.');
                return;
            }

            if (!/^[a-zA-Z0-9]+$/.test(command)) {
                fail(msg, 'The command name can only contain letters and numbers');
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
                    fail(
                        msg,
                        `The command "${command}" is already taken!`,
                    );
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
                fail(msg, `There doesn't seem to be a command called "${command}".`);
                return;
            }

            success(msg);
            return;
        }
        default:
            msg.channel.send(
                `Invalid subcommand. Try: ${validSubCommands}`,
            );
        }
    }

    public async update() {}

    public help(): string {
        return 'Create and manage custom commands with simple, static responses:\n'
             + '* `command add <command> <some response text>` - add a new command.\n'
             + '* `command rm <command>` - remove a command.\n'
             + '* `command info <command>` - shows some basic information about the command.\n'
             + '* `command list` - list all saved commands.\n';
    }

    public async getCommand(knex: Knex, name: string, fields: string[] = ['command', 'response']): Promise<SimpleCommandModel | undefined> {
        const [result] = await knex.select(...fields)
            .from<SimpleCommand>('simplecommands')
            .where('command', name)
            .limit(1);
        return result;
    }

    public async getAll(knex: Knex): Promise<SimpleCommandModel[]> {
        return knex.select('command')
            .from<SimpleCommandModel>('simplecommands');
    }
}

import { Message } from 'discord.js';
import * as Knex from 'knex';

export interface ExecContext {
    msg: Message;
    knex: Knex;
    args: string[];
}

export default interface BaseCommand {
    exec(ctx: ExecContext): Promise<void>;
    help(): string;
};

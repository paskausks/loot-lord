import { Message, Client } from 'discord.js';
import * as Knex from 'knex';

export interface ExecContext {
    msg: Message;
    knex: Knex;
    args: string[];
}

export interface UpdateContext {
    knex: Knex;
    discord: Client;
}

export default interface BaseCommand {
    trigger: string;
    exec(ctx: ExecContext): Promise<void>;
    update(ctx: UpdateContext): Promise<void>;
    sendHelp(msg: Message): Promise<void>;
}

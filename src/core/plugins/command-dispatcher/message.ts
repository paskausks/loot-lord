import * as Knex from 'knex';
import { Message } from 'discord.js';
import { COMMAND_PLUGIN_PREFIX } from '../../../commands/base';

export const COMMAND_DISPATCHER_SUBJECT = `${COMMAND_PLUGIN_PREFIX}CUSTOM`;
export interface CommandDispatcherMessage {
    knex: Knex;
    message: Message;
    command: string;
}

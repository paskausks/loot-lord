import knex from 'knex';
import { Client } from 'discord.js';

export interface PulseMessage {
    knex: knex;
    discord: Client;
}

export const PULSE_SUBJECT_KEY = 'pulse';

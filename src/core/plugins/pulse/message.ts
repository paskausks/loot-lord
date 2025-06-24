import { Knex } from 'knex';
import { Client } from 'discord.js';

export interface PulseMessage {
    knex: Knex;
    discord: Client;
}

export const PULSE_SUBJECT_KEY = 'pulse';

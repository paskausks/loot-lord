/* eslint camelcase: "off" */

export interface FriendlyFire {
    // Knex represents bigint as string.
    // Discord ids coming from discord.js are also
    // strings, so that's convenient.
    killer_id: string;
    victim_id: string;
}

export interface SimpleCommand {
    command: string;
    response: string;
    created_by_id: string;
    created_at: string;
    updated_at: string;
}

/* eslint camelcase: "off" */

export interface FriendlyFire {
    // Knex represents bigint as string.
    // Discord ids coming from discord.js are also
    // strings, so that's convenient.
    killer_id: string;
    victim_id: string;
}

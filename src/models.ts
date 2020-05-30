export interface FriendlyFire {
    // Knex represents bigint as string.
    // Discord ids coming from discord.js are also
    // strings, so that's convenient.
    killer_id: string;
    victim_id: string;
    created_at?: string;
    updated_at?: string;
}

export interface SimpleCommand {
    command: string;
    response: string;
    created_by_id: string;
    created_at: string;
    updated_at: string;
}

export interface Reminder {
    id: number;
    user_id: string;
    reminder: string;
    reminder_at: string;
    reminder_url: string;
    created_at: string;
    updated_at: string;
}

export interface Quote {
    id: number;
    author_id: string;
    nominee_id: string;
    message_id: string;
    message_url: string;
    message: string;
    accepted: number;
    created_at: string;
    updated_at: string;
}

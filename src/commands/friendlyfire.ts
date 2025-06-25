import { Message, MessageMentions, TextChannel } from 'discord.js';
import Command, { ExecContext } from './base';
import {
    reactSuccess as success,
    reactFail as fail,
    getNickname,
} from '../utils/discord';
import { buildHelp } from '../utils/help';
import { getMoment } from '../utils/moment';
import { FriendlyFire as FriendlyFireModel } from '../models';

export default class FriendlyFire extends Command {
    public readonly trigger: string = 'friendly';
    private table = 'friendlyfire';

    public async exec(ctx: ExecContext): Promise<void> {
        const [subCommand, ...args] = ctx.args;
        const AUTHOR = 'me';
        const validSubCommands = [
            '`add`',
            '`stats`',
        ].join(', ');

        const { msg, knex } = ctx;

        if (!ctx.args.length) {
            this.sendHelp(msg);
            return;
        }

        const textChannel = msg.channel as TextChannel;

        switch (subCommand) {
        case 'add': {
            const [killer, victim] = args;

            if (!killer) {
                fail(msg, 'Killer missing. Mention someone or use "me"!');
                return;
            }

            if (!victim) {
                fail(msg, 'Victim missing. Mention someone or use "me"!');
                return;
            }

            const mentions = Array.from(msg.mentions.users.values());
            const pattern = MessageMentions.UsersPattern;

            let killerId: string = msg.author.id;
            if (killer !== AUTHOR) {
                if (!new RegExp(pattern).test(killer)) {
                    fail(msg, 'Killer is not a valid mention.');
                    return;
                }

                killerId = mentions[0].id;
            }

            let victimId: string = msg.author.id;
            if (victim !== AUTHOR) {
                if (!new RegExp(pattern).test(victim)) {
                    fail(msg, 'Victim is not a valid mention.');
                    return;
                }

                if (mentions.length === 1) {
                    victimId = mentions[0].id;
                } else {
                    victimId = mentions[1].id;
                }
            }

            const botId = msg.client.user?.id;

            if (killerId === botId || victimId === botId) {
                fail(msg, 'Don\'t involve me in this');
                return;
            }

            if (killerId === victimId) {
                fail(msg, 'Suicides don\'t count.');
                return;
            }

            await knex(this.table).insert({
                killer_id: killerId,
                victim_id: victimId,
            });

            success(msg);
            break;
        }
        case 'stats': {
            const topKillers = await knex(this.table)
                .select('killer_id')
                .count('killer_id as kill_count')
                .groupBy('killer_id')
                .orderBy('kill_count', 'desc');

            if (!topKillers.length) {
                textChannel.send('No data.');
                return;
            }

            const topVictims = await knex(this.table)
                .select('victim_id')
                .count('victim_id as death_count')
                .groupBy('victim_id')
                .orderBy('death_count', 'desc');

            const [latest] = await knex(this.table)
                .select('killer_id', 'victim_id', 'created_at')
                .limit(1)
                .orderBy('created_at', 'desc') as FriendlyFireModel[];

            const [nemesis] = await knex(this.table)
                .select('killer_id', 'victim_id')
                .count('* as occurence_count')
                .limit(1)
                .groupBy('killer_id', 'victim_id')
                .orderBy('occurence_count', 'desc') as unknown as (FriendlyFireModel & {occurence_count: number})[];

            const [
                latestKiller,
                latestVictim,
                nemesisKiller,
                nemesisVictim,
            ] = await Promise.all([
                latest.killer_id,
                latest.victim_id,
                nemesis.killer_id,
                nemesis.victim_id,
            ].map((v: string) => getNickname(msg, v)));
            const latestTimesince = getMoment(latest.created_at as string).fromNow();
            let killerList = '';
            let i = 0;
            for (i; i < topKillers.length; i += 1) {
                const row = topKillers[i];
                killerList += `\n${i + 1}. ${await getNickname(msg, row.killer_id.toString())} (${row.kill_count} kills)`;
            }

            let victimList = '';
            for (i = 0; i < topVictims.length; i += 1) {
                const row = topVictims[i];
                victimList += `\n${i + 1}. ${await getNickname(msg, row.victim_id.toString())} (${row.death_count} deaths)`;
            }

            textChannel.send(
                'Here\'s what\'s up.\n\n'
                + '**Top killers**:'
                + `${killerList}\n\n`
                + '**Top victims**:'
                + `${victimList}\n\n`
                + '**Latest "accident"**:'
                + ` ${latestKiller} killed ${latestVictim} ${latestTimesince}.\n`
                + '**Nemesis**:'
                + ` ${nemesisKiller} wasted ${nemesisVictim} ${nemesis.occurence_count} times.`,
            );
            break;
        }
        default:
            textChannel.send(
                `Invalid subcommand. Try: ${validSubCommands}`,
            );
        }
    }

    public async sendHelp(msg: Message): Promise<void> {
        (msg.channel as TextChannel).send(buildHelp({
            title: this.trigger,
            description: 'Keeps track of accidental friend murder 🙃\n',
            commands: [
                {
                    command: `${this.trigger} add me @VictimNick`,
                    explanation: 'Adds you as the killer of VictimNick.',
                },
                {
                    command: `${this.trigger} add @KillerNick me`,
                    explanation: 'Adds you as the victim of KillerNick.',
                },
                {
                    command: `${this.trigger} add @KillerNick @VictimNick`,
                    explanation: 'Adds KillerNick as the killer of VictimNick.',
                },
                {
                    command: `${this.trigger} stats`,
                    explanation: 'Lists statistics about the whole deal.',
                },
            ],
        }));
    }
}

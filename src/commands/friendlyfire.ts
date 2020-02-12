import BaseCommand, { ExecContext } from './base';
import Discord from 'discord.js';
import { reactSuccess as success, reactFail as fail } from '../utils';

export default class FriendlyFire implements BaseCommand {
    private table: string = 'friendlyfire';

    public async exec(ctx: ExecContext) {
        const [subCommand, ...args] = ctx.args;
        const AUTHOR = 'me';
        const validSubCommands = [
            '`add`',
            '`stats`',
        ].join(', ');

        const { msg, knex } = ctx;

        if (!subCommand) {
            msg.channel.send(`Missing sub command, try: ${validSubCommands}!`);
            return;
        }

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

            const mentions = msg.mentions.users.array();
            const pattern = Discord.MessageMentions.USERS_PATTERN;

            let killerId: string = msg.author.id;
            if (killer !== AUTHOR) {
                if (!pattern.test(killer)) {
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

            const botId = msg.client.user.id;

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
        case 'stats':
            break;
        default:
            msg.channel.send(
                `Invalid subcommand. Try: ${validSubCommands}`,
            );
        }
    }

    public help(): string {
        return 'Keeps track of accidental friend murder 🙃\n'
        + '* `friendly add me @VictimNick` - adds you as the killer of VictimNick.\n'
        + '* `friendly add @KillerNick me` - adds you as the victim of KillerNick.\n'
        + '* `friendly add @KillerNick @VictimNick` - adds KillerNick as the killer of VictimNick.\n'
        + '* `friendly add @KillerNick @VictimNick` - adds KillerNick as the killer of VictimNick.\n'
        + '* `friendly stats` - lists the top friend killers,'
        + ' the latest "accident", and who has killed who the most.';
    }
}

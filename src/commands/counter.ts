import Command, { ExecContext } from './base';
import { Knex } from 'knex';
import { APIEmbed, Message, TextChannel } from 'discord.js';
import { buildHelp } from '../utils/help';
import { Counter as CounterModel } from '../models';

export default class Counter extends Command {
    public readonly trigger: string = 'cnt';
    private table = 'counter';

    public async exec(ctx: ExecContext): Promise<void> {
        const [subCommand, key, ...args] = ctx.args;
        const validSubCommands = [
            'list',
            'inc',
            'dec',
            'set',
            'delete',
        ];
        
        const { msg, knex } = ctx;
        
        if (!ctx.args.length) {
            this.sendHelp(msg);
            return;
        }

        const textChannel = msg.channel as TextChannel;
        if (ctx.args.length === 1 && !validSubCommands.includes(subCommand)) {
            // Perform read operation
            const counter = await this.getKeyCounter(knex, subCommand);
            if (!counter) {
                textChannel.send(
                    `Counter for ${subCommand} does not exist`,
                );
                return;
            }

            const count = counter?.count || 0;
            
            textChannel.send(
                `Counter for ${subCommand}: ${count}`,
            );
            return;
        }

        const lowercaseKey = key?.toLowerCase() || '';

        switch (subCommand) {
        case 'list': {
            const counters = await this.getAllCounters(knex);

            textChannel.send(this.buildList(counters));
            break;
        }
        case 'inc': {
            const counter = await this.getKeyCounter(knex, lowercaseKey);
            const count = (counter?.count || 0) + 1;
            await this.setKeyCount(knex, key, count);
            textChannel.send(
                `Counter for ${key} incremented to: ${count}`,
            );
            break;
        }
        case 'dec': {
            const counter = await this.getKeyCounter(knex, lowercaseKey);
            const count = (counter?.count || 0) - 1;
            await this.setKeyCount(knex, key, count);
            textChannel.send(
                `Counter for ${key} decremented to: ${count}`,
            );
            break;
        }
        case 'set': {
            const count = Number(args[0]);

            if (isNaN(count)) {
                (msg.channel as TextChannel).send("Provided count is not a valid number. :sob:");
                break;
            }

            await this.setKeyCount(knex, lowercaseKey, count);
            textChannel.send(
                `Counter for ${key} set to: ${count}`,
            );
            break;
        }
        case 'del': {
            await this.deleteKeyCounter(knex, lowercaseKey);
            textChannel.send(
                `Counter for ${key} deleted`,
            );
            break;
        }
        default: {
            this.sendHelp(msg);
            break;
        }
        }

    }

    public async sendHelp(msg: Message): Promise<void> {
        (msg.channel as TextChannel).send(buildHelp({
            title: this.trigger,
            description: 'Keeps track of count for given key.',
            commands: [
                {
                    command: `${this.trigger} list`,
                    explanation: 'Lists all saved counters.',
                },
                {
                    command: `${this.trigger} inc <key>`,
                    explanation: 'Increments count for given key. Starts at 0 if given key doesn\'t already exist.',
                },
                {
                    command: `${this.trigger} dec <key>`,
                    explanation: 'Decrements count for given key. Starts at 0 if given key doesn\'t already exist.',
                },
                {
                    command: `${this.trigger} set <key> <count>`,
                    explanation: 'Sets count for given key.',
                },
                {
                    command: `${this.trigger} del <key>`,
                    explanation: 'Deletes saved counter for given key.',
                },
            ],
        }));
    }

    private buildList(list: CounterModel[]): { embeds: APIEmbed[] } {
        return {
            embeds: [
                {
                    title: 'List of saved counters',
                    fields: [
                        {
                            name: 'key',
                            value: list.map((cnt) => cnt.key).join('\n'),
                            inline: true,
                        },
                        {
                            name: 'count',
                            value: list.map((cnt) => cnt.count).join('\n'),
                            inline: true,
                        },
                    ]
                }
            ]
        };
    }

    private async getKeyCounter(
        knex: Knex,
        key: string,
    ): Promise<CounterModel | undefined> {
        const [result] = await knex
            .select('*')
            .from<CounterModel>(this.table)
            .where('key', key)
            .limit(1) as CounterModel[];
        return result;
    }

    private async setKeyCount(
        knex: Knex,
        key: string,
        count: number,
    ): Promise<void> {
        const response = await knex(this.table).where({ key }).update({
            count,
        });

        if (!response) {
            await knex(this.table).insert({
                key,
                count,
            });
        }
    }

    private async deleteKeyCounter(
        knex: Knex,
        key: string,
    ): Promise<void> {
        await knex
            .select('*')
            .from<CounterModel>(this.table)
            .where('key', key)
            .del();
    }

    private async getAllCounters(
        knex: Knex,
    ): Promise<CounterModel[]> {
        return await knex
            .select('*')
            .from<CounterModel>(this.table);
    }
}
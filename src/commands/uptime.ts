import { Message } from 'discord.js';
import moment from 'moment';
import BaseCommand, { ExecContext } from './base';
import { buildHelp } from '../utils/help';

export default class Uptime implements BaseCommand {
    public readonly trigger: string = 'uptime';
    private dateTime: moment.Moment = moment();
    public async exec(ctx: ExecContext) {
        const uptime = moment.duration(moment().diff(this.dateTime)).humanize();
        ctx.msg.channel.send(
            `The bot has been running for ${uptime} (since ${this.dateTime.utc().format('llll')}).`,
        );
    }

    public async update(): Promise<void> {}

    public async sendHelp(msg: Message): Promise<void> {
        msg.channel.send(buildHelp({
            title: this.trigger,
            description: 'Shows how long the bot has been running uninterrupted.',
        }));
    }
}

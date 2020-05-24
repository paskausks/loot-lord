import { Message } from 'discord.js';
import moment from 'moment';
import Command, { ExecContext } from './base';
import { buildHelp } from '../utils/help';

export default class Uptime extends Command {
    public readonly trigger: string = 'uptime';
    private dateTime: moment.Moment = moment();
    public async exec(ctx: ExecContext) {
        const uptime = moment.duration(moment().diff(this.dateTime)).humanize();
        ctx.msg.channel.send(
            `The bot has been running for ${uptime} (since ${this.dateTime.utc().format('llll')}).`,
        );
    }

    public async sendHelp(msg: Message): Promise<void> {
        msg.channel.send(buildHelp({
            title: this.trigger,
            description: 'Shows how long the bot has been running uninterrupted.',
        }));
    }
}

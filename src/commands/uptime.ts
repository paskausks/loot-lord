import moment from 'moment';
import os from 'os';
import BaseCommand, { ExecContext } from './base';

export default class Uptime implements BaseCommand {
    private dateTime: moment.Moment = moment();
    public async exec(ctx: ExecContext) {
        const uptime = moment.duration(moment().diff(this.dateTime)).humanize();
        ctx.msg.channel.send(
            `The bot has been running for ${uptime} on ${os.type} ${os.arch}.`,
        );
    }

    public async update(): Promise<void> {}

    public help(): string {
        return 'Shows how long the bot has been running uninterrupted.';
    }
}

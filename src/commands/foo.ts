import BaseCommand, { ExecContext } from './base';

export default class Foo implements BaseCommand {
    public async exec(ctx: ExecContext) {
        ctx.msg.channel.send('command foo was executed!');
    }

    public help(): string {
        return 'This is a useless command';
    }
}

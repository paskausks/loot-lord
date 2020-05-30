import fs from 'fs';
import path from 'path';
import moment from 'moment';
import { Message } from 'discord.js';
import { getNickname } from '../utils/discord';
import Command, { ExecContext } from './base';
import { BuildInfo } from '../utils/write-build-info';
import { buildHelp } from '../utils/help';

interface PackageJson {
    version: string;
}

export default class About extends Command {
    public readonly trigger: string = 'about';
    public async exec(ctx: ExecContext): Promise<void> {
        let packageInfo: PackageJson = {
            version: 'DEV',
        };
        let buildTime = moment();

        try {
            packageInfo = JSON.parse(
                fs.readFileSync(path.join(__dirname, '..', '..', 'package.json')).toString(),
            );
        } catch {
            this.log('package.json missing!', 'debug');
        }

        try {
            const buildInfo = JSON.parse(
                fs.readFileSync(path.join(__dirname, '..', '..', 'build-info.json')).toString(),
            ) as BuildInfo;
            buildTime = moment(buildInfo.timestamp);
        } catch {
            this.log('build-info.json missing!', 'debug');
        }

        const author = await getNickname(ctx.msg, '124137111975755776');
        const contribs = (await Promise.all([
            '124898325999648768',
        ].map((id: string) => getNickname(ctx.msg, id))))
            .map((nick: string) => `_${nick}_`)
            .join(', ');

        ctx.msg.channel.send(
            `Loot Lord v${packageInfo.version}.\n\n`
            + `Built on ${buildTime.utc().format('lll')}.\n`
            + `Developed by _${author}_ with contributions from ${contribs}.\n`
            + 'Source code at https://github.com/paskausks/loot-lord\n',
        );
    }

    public async sendHelp(msg: Message): Promise<void> {
        msg.channel.send(buildHelp({
            title: this.trigger,
            description: 'Displays some info about the bot and it\'s authors.',
        }));
    }
}

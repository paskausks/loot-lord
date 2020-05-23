import fs from 'fs';
import path from 'path';
import signale from 'signale';
import moment from 'moment';
import { getNickname } from '../utils/discord';
import BaseCommand, { ExecContext } from './base';
import { BuildInfo } from '../utils/write-build-info';

interface PackageJson {
    version: string;
}

export default class About implements BaseCommand {
    public readonly trigger: string = 'about';
    public async exec(ctx: ExecContext) {
        let packageInfo: PackageJson = {
            version: 'DEV',
        };
        let buildTime = moment();

        try {
            packageInfo = JSON.parse(
                fs.readFileSync(path.join(__dirname, '..', '..', 'package.json')).toString(),
            );
        } catch {
            signale.debug('package.json missing!');
        }

        try {
            const buildInfo = JSON.parse(
                fs.readFileSync(path.join(__dirname, '..', '..', 'build-info.json')).toString(),
            ) as BuildInfo;
            buildTime = moment(buildInfo.timestamp);
        } catch {
            signale.debug('build-info.json missing!');
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

    public async update(): Promise<void> {}

    public help(): string {
        return 'Displays some info about the bot and it\'s authors.';
    }
}

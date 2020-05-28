import { Message } from 'discord.js';
import Command, { ExecContext } from './base';
import {
    reactFail as fail,
} from '../utils/discord';
import { getNewestRegularMessage } from '../utils/bot';
import { buildHelp } from '../utils/help';

interface EmojiAlphabet {
    [key: string]: string;
}

/**
 * Create an alphabet using regional indicators.
 */
const emojiAlphabet: EmojiAlphabet = {
    0: '0️⃣',
    1: '1️⃣',
    2: '2️⃣',
    3: '3️⃣',
    4: '4️⃣',
    5: '5️⃣',
    6: '6️⃣',
    7: '7️⃣',
    8: '8️⃣',
    9: '9️⃣',
    a: '🇦',
    b: '🇧',
    c: '🇨',
    d: '🇩',
    e: '🇪',
    f: '🇫',
    g: '🇬',
    h: '🇭',
    i: '🇮',
    j: '🇯',
    k: '🇰',
    l: '🇱',
    m: '🇲',
    n: '🇳',
    o: '🇴',
    p: '🇵',
    q: '🇶',
    r: '🇷',
    s: '🇸',
    t: '🇹',
    u: '🇺',
    v: '🇻',
    w: '🇼',
    x: '🇽',
    y: '🇾',
    z: '🇿',
};

export default class React extends Command {
    // Reacting is increeeeeedibly slow
    // so we limit the amount of characters
    private MAXLENGTH: number = 10;

    public readonly trigger: string = 'react';

    public async exec(ctx: ExecContext) {
        const { msg, args } = ctx;

        if (!args.length) {
            this.sendHelp(msg);
            return;
        }

        const word = args.join(' ').trim();

        if (word.length > this.MAXLENGTH) {
            fail(msg, `The input is longer than ${this.MAXLENGTH} characters!`);
            return;
        }

        const targetMessage = await getNewestRegularMessage(msg);

        if (!targetMessage) {
            fail(msg, 'No messages have been cached which I can react to!');
            return;
        }

        // Using set since there's no point having duplicate characters
        new Set(word).forEach((char) => {
            const emoji = emojiAlphabet[char.toLowerCase()];

            if (!emoji) {
                return;
            }

            targetMessage.react(emoji);
        });
    }

    public async sendHelp(msg: Message): Promise<void> {
        msg.channel.send(buildHelp({
            title: this.trigger,
            description: 'Writing a word with reactions, wow, so amaze!',
            commands: [{
                command: 'react <word>',
                explanation: `React to the last message (non-bot and non-command) with a word. Limited to ${this.MAXLENGTH} characters.`,
            }],
        }));
    }
}

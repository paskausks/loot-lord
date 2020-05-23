import BaseCommand, { ExecContext } from './base';
import {
    reactFail as fail,
} from '../utils/discord';
import { getPrefix } from '../utils/misc';

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

export default class React implements BaseCommand {
    // Reacting is increeeeeedibly slow
    // so we limit the amount of characters
    private MAXLENGTH: number = 10;

    public readonly trigger: string = 'react';

    public async exec(ctx: ExecContext) {
        const { msg, args } = ctx;

        if (!args.length) {
            msg.channel.send(this.help());
            return;
        }

        const word = args.join(' ').trim();

        if (word.length > this.MAXLENGTH) {
            fail(msg, `The input is longer than ${this.MAXLENGTH} characters!`);
            return;
        }

        // Get the last message which isn't a bot
        // command and isn't from the bot itself.
        const allTargetMessages = msg.channel.messages.filter(
            (message) => !message.content.startsWith(getPrefix()) && !message.author.bot,
        ).array();
        const targetMessage = allTargetMessages[allTargetMessages.length - 1];

        if (!targetMessage) {
            fail(msg, 'No messages have been cached which I can react to!');
            return;
        }

        Array.from(word).forEach((char) => {
            const emoji = emojiAlphabet[char.toLowerCase()];

            if (!emoji) {
                return;
            }

            targetMessage.react(emoji);
        });
    }

    public async update(): Promise<void> {}

    public help(): string {
        return `React to the last message (excluding bot command messages) with text. Limited to ${this.MAXLENGTH} characters.`;
    }
}

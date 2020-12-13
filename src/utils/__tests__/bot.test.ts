import { Collection } from 'discord.js';
import { env } from 'process';
import {
    getPrefix, splitMessage, getRegularMessages, getNewestRegularMessage,
} from '../bot';

function getMessageInput() {
    const cache: Collection<string, any> = new Collection();
    const messages = [
        {
            content: '!cmd',
            author: {
                bot: false,
            },
        },
        {
            content: 'bot response',
            author: {
                bot: true,
            },
        },
        {
            content: 'a real message',
            author: {
                bot: false,
            },
        },
        {
            content: 'another real message',
            author: {
                bot: false,
            },
        },
    ];

    messages.forEach((item, i) => cache.set(i.toString(), item));

    return {
        channel: {
            messages: { cache },
        }
    }
}

describe('bot utils', () => {
    describe('getPrefix', () => {

        it('should return the default if no env var specified', () => {
            expect(getPrefix()).toBe('!');
        });

        it('should return the prefix specified in the DISCORD_BOT_PREFIX env var', () => {
            const expected = '>';
            env.DISCORD_BOT_PREFIX = expected;
            expect(getPrefix()).toBe(expected);
        });

        afterAll(() => {
            env.DISCORD_BOT_PREFIX = '';
        });
    });

    describe('splitMessage', () => {
        it('should split a message properly into a command and args, sans-prefix.', () => {
            const message = {
                content: '!somecommand arg1 arg2',
            };

            expect(splitMessage(message)).toEqual({
                command: 'somecommand',
                args: ['arg1', 'arg2'],
            });
        });
    });

    describe('getRegularMessages', () => {
        it('should return messages which aren\'t bot commands and which aren\t from the bot.', () => {
            const input = getMessageInput();
            const result = input.channel.messages.cache.array().slice(2);
            expect(getRegularMessages(input as any)).toEqual(result);
        })
    });

    describe('getNewestRegularMessage', () => {
        it('should return the last message which aren\'t bot commands and which aren\t from the bot.', () => {
            const input = getMessageInput();
            expect(getNewestRegularMessage(input as any)).toEqual({
                content: 'another real message',
                author: {
                    bot: false,
                },
            });
        })
    });
});

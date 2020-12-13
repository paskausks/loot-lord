import { Collection } from 'discord.js';
import { reactWithReply, getGuildMember, getUser, getNickname } from '../discord';

describe('discord utils', () => {
    describe('reactSuccess', () => {
        it('should react with a success checkmark on the provided message', async () => {
            const react = jest.fn();
            const sourceMsg = {
                react,
            }

            const reaction = '✅';
            await reactWithReply(sourceMsg as any, reaction);

            expect(sourceMsg.react).toBeCalledWith(reaction);
        });

        it('should react with a success checkmark on the provided message and send a reply', async () => {
            const react = jest.fn();
            const send = jest.fn();
            const sourceMsg = {
                channel: { send },
                react,
            }

            const reaction = '✅';
            const text = 'oh hi mark';
            await reactWithReply(sourceMsg as any, reaction, text);

            expect(sourceMsg.react).toBeCalledWith(reaction);
            expect(sourceMsg.channel.send).toBeCalledWith(text);
        });
    });

    describe('getGuildMember', () => {
        it('should return a discord server member with the provided user id from a discord message', () => {
            const cache: Collection<string, any> = new Collection();
            const theOne = { user: { id: 'bar' } };
            cache.set('1', { user: { id: 'foo' } });
            cache.set('2', theOne);
            cache.set('3', { user: { id: 'baz' } });

            expect(getGuildMember({
                guild: {
                    members: { cache },
                }
            } as any, 'bar')).toEqual(theOne);
        });
        it('should return undefined if the member isn\'t found', () => {
            const cache: Collection<string, any> = new Collection();
            cache.set('1', { user: { id: 'foo' } });
            cache.set('2', { user: { id: 'xyz' } });
            cache.set('3', { user: { id: 'baz' } });

            expect(getGuildMember({
                guild: {
                    members: { cache },
                }
            } as any, 'bar')).toEqual(undefined);
        });
    });

    describe('getUser', () => {
        it('should return a user with the provided id', () => {
            const cache: Collection<string, any> = new Collection();
            const theOne = { id: 'xyz' };
            cache.set('1', { id: 'foo' });
            cache.set('2', theOne);
            cache.set('3', { id: 'baz' });

            expect(getUser({ users: { cache } } as any, 'xyz')).toEqual(theOne);
        })

        it('should return undefined if the user does not exist', () => {
            const cache: Collection<string, any> = new Collection();
            cache.set('1', { id: 'foo' });
            cache.set('2', { id: 'xyz' });
            cache.set('3', { id: 'baz' });

            expect(getUser({ users: { cache } } as any, '123')).toEqual(undefined);
        })
    });

    describe('getNickname', () => {
        it('should return the guild nickname from a message', async () => {
            const cache: Collection<string, any> = new Collection();
            const nickname = 'ninja';
            cache.set('1', { nickname, user: { id: 'foo' } });

            expect(await getNickname({
                guild: {
                    members: { cache },
                },
            } as any, 'foo')).toBe(nickname);
        });

        it('should return the username from a message if a guild nickname not set', async () => {
            const cache: Collection<string, any> = new Collection();
            const username = 'ninja';
            cache.set('1', { user: { id: 'foo', username } });

            expect(await getNickname({
                guild: {
                    members: { cache },
                },
            } as any, 'foo')).toBe(username);
        });

        it('should return the username from a message if user not found in guild member cache', async () => {
            const cache: Collection<string, any> = new Collection();
            const username = 'ninja';
            const id = 'foo';
            const fetchUser = jest.fn(async () => ({ id, username }));

            expect(await getNickname({
                guild: {
                    members: { cache },
                },
                client: {
                    users: { fetch: fetchUser }
                 },
            } as any, id)).toBe(username);
            expect(fetchUser).toBeCalledWith(id);
        });

        it('should return "Unknown" if an error occurs fetching the user', async () => {
            const cache: Collection<string, any> = new Collection();
            const fetchUser = jest.fn(() => Promise.reject(new Error('boo!')));

            expect(await getNickname({
                guild: {
                    members: { cache },
                },
                client: {
                    users: { fetch: fetchUser }
                 },
            } as any, 'xxx')).toBe('Unknown');
            expect(fetchUser).toBeCalled();
        });
    });
});

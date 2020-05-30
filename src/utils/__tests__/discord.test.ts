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
            const members: Collection<string, any> = new Collection();
            const theOne = { user: { id: 'bar' } };
            members.set('1', { user: { id: 'foo' } });
            members.set('2', theOne);
            members.set('3', { user: { id: 'baz' } });

            expect(getGuildMember({
                guild: {
                    members,
                }
            } as any, 'bar')).toEqual(theOne);
        });
        it('should return null if the member isn\'t found', () => {
            const members: Collection<string, any> = new Collection();
            members.set('1', { user: { id: 'foo' } });
            members.set('2', { user: { id: 'xyz' } });
            members.set('3', { user: { id: 'baz' } });

            expect(getGuildMember({
                guild: {
                    members,
                }
            } as any, 'bar')).toEqual(null);
        });
    });

    describe('getUser', () => {
        it('should return a user with the provided id', () => {
            const users: Collection<string, any> = new Collection();
            const theOne = { id: 'xyz' };
            users.set('1', { id: 'foo' });
            users.set('2', theOne);
            users.set('3', { id: 'baz' });

            expect(getUser({ users } as any, 'xyz')).toEqual(theOne);
        })

        it('should return null if the user does not exist', () => {
            const users: Collection<string, any> = new Collection();
            users.set('1', { id: 'foo' });
            users.set('2', { id: 'xyz' });
            users.set('3', { id: 'baz' });

            expect(getUser({ users } as any, '123')).toEqual(null);
        })
    });

    describe('getNickname', () => {
        it('should return the guild nickname from a message', async () => {
            const members: Collection<string, any> = new Collection();
            const nickname = 'ninja';
            members.set('1', { nickname, user: { id: 'foo' } });

            expect(await getNickname({
                guild: {
                    members,
                }
            } as any, 'foo')).toBe(nickname);
        });

        it('should return the username from a message if a guild nickname not set', async () => {
            const members: Collection<string, any> = new Collection();
            const username = 'ninja';
            members.set('1', { user: { id: 'foo', username } });

            expect(await getNickname({
                guild: {
                    members,
                }
            } as any, 'foo')).toBe(username);
        });

        it('should return the username from a message if user not found in guild member cache', async () => {
            const members: Collection<string, any> = new Collection();
            const username = 'ninja';
            const id = 'foo';
            const fetchUser = jest.fn(async () => ({ id, username }));

            expect(await getNickname({
                guild: {
                    members,
                },
                client: { fetchUser },
            } as any, id)).toBe(username);
            expect(fetchUser).toBeCalledWith(id);
        });

        it('should return "Unknown" if an error occurs fetching the user', async () => {
            const members: Collection<string, any> = new Collection();
            const fetchUser = jest.fn(() => Promise.reject(new Error('boo!')));

            expect(await getNickname({
                guild: {
                    members,
                },
                client: { fetchUser },
            } as any, 'xxx')).toBe('Unknown');
            expect(fetchUser).toBeCalled();
        });
    });
});

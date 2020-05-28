import {
    Message, GuildMember, Client, User,
} from 'discord.js';

// eslint-disable-next-line import/prefer-default-export
export const reactSuccess = async (sourceMsg: Message, reply?: string) => {
    await sourceMsg.react('✅');

    if (reply) {
        sourceMsg.channel.send(reply);
    }
};

export const reactFail = async (sourceMsg: Message, reply?: string) => {
    await sourceMsg.react('❌');

    if (reply) {
        sourceMsg.channel.send(reply);
    }
};

export const getGuildMember = async (
    source: Message, userId: string,
): Promise<GuildMember | null> => source.guild.members.find(
    (m: GuildMember) => m.user.id === userId,
);

export const getUser = async (
    source: Client, userId: string,
): Promise<User | null> => source.users.find(
    (user: User) => user.id === userId,
);

export const getNickname = async (
    source: Message, userId: string,
): Promise<string> => {
    let member;
    try {
        member = await getGuildMember(source, userId);
    } catch (e) {
        member = null;
    }

    if (!member) {
        // Has left the server or source is DM
        let user;
        try {
            user = await source.client.fetchUser(userId);
        } catch (e) {
            return 'Unknown';
        }
        return user.username;
    }

    return member.nickname || member.user.username;
};

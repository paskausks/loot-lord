import Discord from 'discord.js';
import moment from 'moment';

// eslint-disable-next-line import/prefer-default-export
export const reactSuccess = async (sourceMsg: Discord.Message, reply?: string) => {
    await sourceMsg.react('✅');

    if (reply) {
        sourceMsg.channel.send(reply);
    }
};

export const reactFail = async (sourceMsg: Discord.Message, reply?: string) => {
    await sourceMsg.react('❌');

    if (reply) {
        sourceMsg.channel.send(reply);
    }
};

export const getMoment = (dateString: string): moment.Moment => moment
    .utc(dateString)
    .local();

export const getGuildMember = async (
    source: Discord.Message, userId: string,
): Promise<Discord.GuildMember | null> => source.guild.members.find(
    (m: Discord.GuildMember) => m.user.id === userId,
);

export const getUser = async (
    source: Discord.Client, userId: string,
): Promise<Discord.User | null> => source.users.find(
    (user: Discord.User) => user.id === userId,
);

export const getNickname = async (
    source: Discord.Message, userId: string,
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

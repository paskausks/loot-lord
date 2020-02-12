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

export const getNickname = async (
    source: Discord.Message, userId: string,
): Promise<string> => {
    const member = await getGuildMember(source, userId);

    if (!member) {
        // Has left the server
        const user = await source.client.fetchUser(userId);
        return user.username;
    }

    return member.nickname || member.user.username;
};

import {
    Message, GuildMember, Client, User,
} from 'discord.js';

async function reactWithReply(
    sourceMsg: Message,
    reaction: string,
    reply?: string,
): Promise<void> {
    await sourceMsg.react(reaction);

    if (reply) {
        sourceMsg.channel.send(reply);
    }
}

async function reactSuccess(sourceMsg: Message, reply?: string): Promise<void> {
    reactWithReply(sourceMsg, '✅', reply);
}

async function reactFail(sourceMsg: Message, reply?: string): Promise<void> {
    reactWithReply(sourceMsg, '❌', reply);
}

function getGuildMember(
    source: Message, userId: string,
): GuildMember | null {
    return source.guild.members.find(
        (m: GuildMember) => m.user.id === userId,
    );
}

function getUser(
    source: Client, userId: string,
): User | null {
    return source.users.find(
        (user: User) => user.id === userId,
    );
}

async function getNickname(
    source: Message, userId: string,
): Promise<string> {
    let member;
    try {
        member = getGuildMember(source, userId);
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
}

export {
    reactWithReply,
    reactFail,
    reactSuccess,
    getGuildMember,
    getUser,
    getNickname,
};

import {
    Message, GuildMember, Client, User,
    PartialMessage,
} from 'discord.js';

async function reactWithReply(
    sourceMsg: Message | PartialMessage,
    reaction: string,
    reply?: string,
): Promise<void> {
    await sourceMsg.react(reaction);

    if (reply) {
        sourceMsg.reply(reply);
    }
}

async function reactSuccess(sourceMsg: Message | PartialMessage, reply?: string): Promise<void> {
    reactWithReply(sourceMsg, '✅', reply);
}

async function reactFail(sourceMsg: Message, reply?: string): Promise<void> {
    reactWithReply(sourceMsg, '❌', reply);
}

function getGuildMember(
    source: Message, userId: string,
): GuildMember | undefined {
    return source.guild?.members.cache.find(
        (m: GuildMember) => m.user.id === userId,
    );
}

function getUser(
    source: Client, userId: string,
): User | undefined {
    return source.users.cache.find(
        (user: User) => user.id === userId,
    );
}

async function getNickname(
    source: Message, userId: string,
): Promise<string> {
    let member;
    try {
        member = getGuildMember(source, userId);
    } catch (_e) {
        member = null;
    }

    if (!member) {
        // Has left the server or source is DM
        let user;
        try {
            user = await source.client.users.fetch(userId);
        } catch (_e) {
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

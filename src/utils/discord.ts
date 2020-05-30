import {
    Message, GuildMember, Client, User,
} from 'discord.js';

export async function reactSuccess(sourceMsg: Message, reply?: string): Promise<void> {
    await sourceMsg.react('✅');

    if (reply) {
        sourceMsg.channel.send(reply);
    }
}

export async function reactFail(sourceMsg: Message, reply?: string): Promise<void> {
    await sourceMsg.react('❌');

    if (reply) {
        sourceMsg.channel.send(reply);
    }
}

export async function getGuildMember(
    source: Message, userId: string,
): Promise<GuildMember | null> {
    return source.guild.members.find(
        (m: GuildMember) => m.user.id === userId,
    );
}

export async function getUser(
    source: Client, userId: string,
): Promise<User | null> {
    return source.users.find(
        (user: User) => user.id === userId,
    );
}

export async function getNickname(
    source: Message, userId: string,
): Promise<string> {
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
}

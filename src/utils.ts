import Discord from 'discord.js';

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

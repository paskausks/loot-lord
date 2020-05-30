import { getPrefix } from './bot';

/**
 * Desribes a command trigger
 * and it's explanation.
 */
interface HelpCommandDescription {
    command: string;
    explanation: string;
}

/**
 * A field for additional information.
 * Put after the command info
 */
interface HelpAdditionalField {
    title: string;
    value: string;
}

/**
 * Params required for building a help message
 */
interface HelpBuilderContext {
    title: string;
    description: string;
    commands?: HelpCommandDescription[];
    additional?: HelpAdditionalField[];
}

/**
 * An object usable as an embed,
 * meant for command help messages.
 */
interface HelpEmbed {
    title: string;
    description: string;
    color: number;
    fields: { name: string; value: string }[];
}

/**
 * Builds a help command ready to send as a Discord message.
 */
function buildHelp(helpContext: HelpBuilderContext): { embed: HelpEmbed } {
    const prefix = getPrefix();
    const fields = (helpContext.commands || [])
        .map((command) => ({ name: `${prefix}${command.command}`, value: command.explanation }))
        .concat((helpContext.additional || []).map((add) => ({
            name: add.title,
            value: add.value,
        })));

    return {
        embed: {
            title: helpContext.title,
            description: helpContext.description,
            color: 8604151,
            fields,
        },
    };
}

export {
    HelpBuilderContext,
    buildHelp,
};

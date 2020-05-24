import {
    from, fromEvent, Observable, Subject,
} from 'rxjs';
import { filter, map } from 'rxjs/operators';
import Discord from 'discord.js';
import { getPrefix, splitMessage } from '../utils/bot';

/**
 * rxjs observables
 */

/**
 * A parsed discord message with
 * an extracted command and arguments.
 */
export interface BotCommandMessage {
    message: Discord.Message
    command: string;
    args: string[];
}

export type ClientObservable = Observable<Discord.Client>;
export type SubjectMap = Map<string, Subject<any>>;
export type MessageObservable = Observable<Discord.Message>;
export type BotCommandMessageObservable = Observable<BotCommandMessage>;

export const ready = (client: Discord.Client): ClientObservable => fromEvent(client, 'ready').pipe(
    map(() => client),
);
export const rawMessage = (client: Discord.Client): MessageObservable => fromEvent(client, 'message');

/**
 * An observable which broadcasts messages which could be
 * valid bot commands.
 */
// eslint-disable-next-line import/prefer-default-export
export const botCommandMessage = (client: Discord.Client): BotCommandMessageObservable => {
    const pref = getPrefix();
    return from(rawMessage(client)).pipe(
        filter((msg) => msg.content.startsWith(pref) && !msg.author.bot),
        filter((msg) => msg.content.length > pref.length),
        map((message) => ({
            message,
            ...splitMessage(message),
        })),
    );
};

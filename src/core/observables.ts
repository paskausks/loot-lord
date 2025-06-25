import {
    from, fromEvent, Observable, Subject,
} from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
    Client, Events, Message, MessageReaction, User,
} from 'discord.js';
import { getPrefix, splitMessage } from '../utils/bot';

/**
 * rxjs observables
 */

/**
 * A parsed discord message with
 * an extracted command and arguments.
 */
export interface BotCommandMessage {
    message: Message;
    command: string;
    args: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SubjectMap = Map<string, Subject<any>|Observable<any>>;
export type ClientObservable = Observable<Client>;
export type MessageObservable = Observable<Message>;
export type BotCommandMessageObservable = Observable<BotCommandMessage>;
export type ReactionAddObservable = Observable<[MessageReaction, User]>;

export const ready = (client: Client): ClientObservable => fromEvent(client, Events.ClientReady).pipe(
    map(() => client),
);
export const rawMessage = (client: Client): MessageObservable => fromEvent(client, Events.MessageCreate);
export const reactionAdd = (client: Client): ReactionAddObservable => fromEvent(client, Events.MessageReactionAdd);

/**
 * An observable which broadcasts messages which could be
 * valid bot commands.
 */
export const botCommandMessage = (client: Client): BotCommandMessageObservable => {
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

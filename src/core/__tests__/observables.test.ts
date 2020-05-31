import { EventEmitter } from 'events';
import { botCommandMessage, ready } from '../observables';

class FakeClient extends EventEmitter {};

describe('observables', () => {
    describe('ready', () => {
        it('should emit the client instance on the ready event', (done) => {
            const client = new FakeClient();
            const observable = ready(client as any);

            observable.subscribe((emittedClient) => {
                expect(emittedClient instanceof FakeClient).toBeTruthy();
                done();
            });

            client.emit('ready');
        });
    });

    describe('botCommandMessage', () => {
        it('should emit messages beginning with the prefix and not from the bot', (done) => {
            const client = new FakeClient();
            const observable = botCommandMessage(client as any);
            const args = ['foo', 'bar'];
            const command = 'testcommand';
            const message = {
                content: '!testcommand foo bar',
                author: {
                    bot: false
                }
            };

            observable.subscribe((msg) => {
                expect(msg.args).toEqual(['foo', 'bar']);
                expect(msg.command).toEqual('testcommand');
                expect(msg).toEqual({ args, command, message });
                done();
            });

            // Should not be piped - doesn't start with a prefix.
            client.emit('message', {
                content: 'hello from a fake message',
                author: {
                    bot: false,
                }
            });

            // Should not be piped - only the prefix
            client.emit('message', {
                content: '!',
                author: {
                    bot: false,
                }
            });

            // Should not be piped - comes from the bot
            client.emit('message', {
                content: 'hi!',
                author: {
                    bot: true,
                }
            });

            // Correct message
            client.emit('message', message);
        });
    });
});

import Uptime from '../uptime';
import { buildHelp }  from '../../utils/help';

jest.mock('../../utils/help', () => ({
    buildHelp: jest.fn(),
}));

describe('Uptime', () => {
    describe('Uptime#exec', () => {
        it('should return the bot\'s uptime', async () => {
            const uptime = new Uptime({} as any);
            const sendFn = jest.fn();
            await uptime.exec({
                msg: {
                    channel: {
                        send: sendFn,
                    }
                }
            } as any);

            // Just check for the approximate message.
            expect(sendFn.mock.calls[0][0]).toContain('The bot has been running for a few seconds (since');
        });
    });

    describe('Uptime#sendHelp', () => {
        it('should send the help message for the uptime command', async () => {
            const uptime = new Uptime({} as any);
            await uptime.sendHelp({
                channel: {
                    send: () => null,
                }
            } as any);

            expect(buildHelp).toHaveBeenCalledWith({
                title: 'uptime',
                description: 'Shows how long the bot has been running uninterrupted.',
            });
        });
    });
});

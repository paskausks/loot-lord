import { success, info, warn, error, debug, DefaultMethods } from 'signale';
import { Subject } from 'rxjs';
import Logger from '../logger';
import LoggerMessage from '../message';

jest.mock('signale', () => ({
    success: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
}));

describe('Logger', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should subscribe to the ready observable with a proper handler.', () => {
        const subscribe = jest.fn();
        const plugins: Map<string, any> = new Map();
        const options = {
            ready: { subscribe },
            commandMessages:  { subscribe },
            plugins,
        } as any;

        new Logger(options);
        expect(subscribe).toHaveBeenCalledTimes(2);

        // call the next handler of the ready observable
        // and check if signale has been called
        subscribe.mock.calls[0][0]({ user: { tag: 'fakebot#123' }});
        expect(success).toHaveBeenCalledWith('Logged in as fakebot#123!');
    });

    test.each([
        ['via direct message', {
            author: {
                tag: 'john#3210',
            },
        }, 'Rcvd cmd "test one two" from john#3210 via direct message.'],
        ['via guild channel', {
            channel: {
                name: 'testchan'
            },
            guild: {
                name: 'Super Server'
            },
            author: {
                tag: 'steve#1234',
            },
        }, 'Rcvd cmd "test one two" from steve#1234 on Super Server, #testchan.'],
    ])(
        'should log properly upon receiving a command %s.',
        (_via: string, mockMessage: any, expected: string) => {
            const subscribe = jest.fn();
            const plugins: Map<string, any> = new Map();
            const options = {
                ready: { subscribe: () => null },
                commandMessages:  { subscribe },
                plugins,
            } as any;

            new Logger(options);

            // call the next handler of the commandMessages
            // and check if signale has been called
            subscribe.mock.calls[0][0]({
                message: mockMessage,
                command: 'test',
                args: ['one', 'two'],
            });

            expect(info).toHaveBeenCalledWith(expected);
        }
    );

    test.each([
        ['', 'default level message', info],
        ['success', 'test message', success],
        ['info', 'test info message', info],
        ['warn', 'test warning message', warn],
        ['error', 'test error message', error],
        ['debug', 'test debug message', debug],
    ])(
        'should log using signale %s method via it\'s exposed rxjs subject',
        (level: string | undefined, message: string, mockedSignaleFunc: () => any) => {
            const plugins: Map<string, any> = new Map();
            const options = {
                ready: { subscribe: () => null },
                    commandMessages:  { subscribe: () => null},
                    plugins,
            } as any;

            new Logger(options);

            const loggerSubect: Subject<LoggerMessage> = plugins.get('logger');
            loggerSubect.next({ message, level: level as DefaultMethods });
            expect(mockedSignaleFunc).toHaveBeenCalledWith(message);
        },
    );
});

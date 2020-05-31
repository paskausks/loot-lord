import Roll from '../roll';

describe('Roll', () => {
    describe('Roll.intRange', () => {
        test.each([
            [69, 0, 100, () => 0.69],
            [42, 100, 0, () => 0.42],
            [1, 1, 5, () => 0],
            [99, 1, 100, () => 0.99],
            [-10, -10, 10, () => 0],
            [9, -10, 10, () => 0.99],
            [-6, -10, -5, () => 0.99],
            [-6, -5, -10, () => 0.99],
        ])(
            'it should return %p from the range %p to %p',
            (expected: number, from: number, to: number, func: () => number) => {
                expect(Roll.intRange(from, to, func)).toBe(expected);
            },
        );
    });
    describe('Roll#exec', () => {

        beforeAll(() => {
            Roll.intRange = jest.fn(Roll.intRange);
        });

        beforeEach(() => {
            (Roll.intRange as jest.MockedFunction<typeof Roll.intRange>).mockClear();
        });

        afterAll(() => {
            (Roll.intRange as jest.MockedFunction<typeof Roll.intRange>).mockRestore();
        });

        it('should show help when only a "help" argument is provided', async () => {
            const roll = new Roll({} as any);
            roll.sendHelp = jest.fn();

            const ctx = {
                msg: {
                    channel: {
                        send: () => null,
                    }
                },
                args: ['help'],
            };

            await roll.exec(ctx as any);
            expect(roll.sendHelp).toBeCalledWith(ctx.msg);
        });

        it('should just send a reaction and a reply if a single non-numeric argument has been provided', async () => {
            const roll = new Roll({} as any);
            const sendFn = jest.fn();
            const reactFn = jest.fn();
            const ctx = {
                msg: {
                    channel: {
                        send: sendFn,
                    },
                    react: reactFn,
                },
                args: ['foobar'],
            };

            await roll.exec(ctx as any);
            expect(reactFn).toBeCalledWith('❌');
            expect(sendFn).toBeCalledWith('if you are providing just 1 argument, it has to be a number!');
        });

        test.each([
            [['64'], [0, 65]],
            [['d20'], [1, 21]],
            [['5', '94'], [5, 94]],
        ])(
            'when given command arguments are %p, should call Roll.intRange with %p.',
            async (args: string[], intRangeArgs: number[]) => {
                const roll = new Roll({} as any);
                const ctx = {
                    msg: {
                        channel: {
                            send: () => null,
                        }
                    },
                    args: args,
                };

                await roll.exec(ctx as any);
                expect(Roll.intRange).toBeCalledWith(...intRangeArgs);
            }
        );

        test.each([
            ['steve', 'john'],
            ['steve', 'john', 'peter'],
        ])(
        'should return one of the given choices',
        async (...choices: string[]) => {
            const roll = new Roll({} as any);
            const sendFn = jest.fn();
            const ctx = {
                msg: {
                    channel: {
                        send: sendFn,
                    }
                },
                args: choices,
            };

            await roll.exec(ctx as any);

            // Just check if reply has been one of the possible choices.
            const possibleReplies = choices.map((name) => `🎲 **${name}** 🎲`);
            expect(possibleReplies.some((call) => call === sendFn.mock.calls[0][0])).toBeTruthy();
        });
    });
});

import { execReminderMessage } from '../parsers';

describe('reminder parsers', () => {
    describe('execReminderMessage', () => {
        test.each([
            ['at 1234 test msg', 'at (\\d+)', true, [
                '1234',
                'test msg',
            ]],
            ['test msg at 1234', 'at (\\d+)', false, [
                'test msg',
                '1234',
            ]],
            ['test msgat 1234 ', 'at (\\d+)', true, null],
            ['at 1234test msg', 'at (\\d+)', true, null],
        ])(
            'should exec %p correctly',
            (
                msg: string,
                timePattern: string,
                reverse: boolean,
                expected: string[] | null,
            ) => {
                const result = execReminderMessage(msg, timePattern, reverse);
                if (result !== null) {
                    expect([...result.slice(1, 3)]).toEqual(expected);
                    return;
                }

                expect(result).toEqual(expected);
            },
        );
    });
});

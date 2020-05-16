import { isValidSequenceNumber } from '../../src/utils/number';

describe('number utils', () => {
    describe('isValidSequenceNumber', () => {
        test.each([
            ['1st', true],
            ['2nd', true],
            ['3rd', true],
            ['4th', true],
            ['22nd', true],
            ['31st', true],
            ['21rd', false],
            ['37nd', false],
            ['rd', false],
            ['st', false],
            ['nd', false],
            ['hello', false],
            ['not a number', false],
            ['0', false],
        ])(
            '%p is a valid sequence number input - %p',
            (input: string, expected: boolean) => {
                expect(isValidSequenceNumber(input)).toBe(expected);
            },
        );
    });
});

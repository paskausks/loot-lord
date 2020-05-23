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
});

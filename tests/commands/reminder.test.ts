import moment from 'moment';
import Reminder from '../../src/commands/reminder';

describe('reminder', () => {
    // Set a constant time for testing the parser
    // so we can check with someMoment.isSame('')
    const fromDate = new Date(2020, 0, 1, 13, 28, 14, 321);

    describe('reminder#parseReminder', () => {
        test.each([
            // As of 2.12.0 when decimal values are passed for days and months, they are rounded to the nearest integer. Weeks, quarters, and years are converted to days or months, and then rounded to the nearest integer.
            ['pickup milk in 17 minutes', 'pickup milk', new Date(2020, 0, 1, 13, 45, 14, 321)],
            ['do the dishes in 2.5 hours', 'do the dishes', new Date(2020, 0, 1, 15, 58, 14, 321)],
            ['go to see the new movie in 3 days', 'go to see the new movie', new Date(2020, 0, 4, 13, 28, 14, 321)],
            ['party at some place in 2 months', 'party at some place', new Date(2020, 2, 1, 13, 28, 14, 321)],
            ['be on a big journey in 6 years', 'be on a big journey', new Date(2026, 0, 1, 13, 28, 14, 321) ],
            //['at 8:55pm'],
            //['at 12:23am'],
            //['at 09:17'],
            //['at 14:09'],
            //['at midnight'],
            //['on January 1'],
            //['on 9 Feb'],
            //['on 30.11.2020'],
            //['on Thursday'],
        ])('should parse %p', (
            input: string,
            expectedMessage: string,
            expectedTime: Date,
        ) => {
            const reminder = new Reminder();
            const result = reminder.parseReminder(input, fromDate);
            expect(result.reminder).toBe(expectedMessage);
            expect(result.time.isSame(expectedTime)).toBe(true);
        });

        it.todo('should throw an error if ...'); // TODO!
    });
});

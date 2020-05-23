import moment from 'moment';
import Reminder from '../reminder';

describe('reminder', () => {
    // Set a constant time for testing the parser
    // so we can check with someMoment.isSame('')
    const fromDate = new Date(2020, 0, 1, 13, 28, 14, 321); // a Wednesday

    describe('reminder#parseReminder', () => {
        test.each([
            // As of 2.12.0 when decimal values are passed for days and months,
            // they are rounded to the nearest integer.
            // Weeks, quarters, and years are converted to days or months,
            // and then rounded to the nearest integer.

            // in <amount> <unit>
            ['pickup milk in 17 minutes', 'pickup milk', new Date(2020, 0, 1, 13, 45, 14, 321)],
            ['in 17 minutes pickup milk', 'pickup milk', new Date(2020, 0, 1, 13, 45, 14, 321)],
            ['do the dishes in 2.5 hours', 'do the dishes', new Date(2020, 0, 1, 15, 58, 14, 321)],
            ['in 2.5 hours do the dishes ', 'do the dishes', new Date(2020, 0, 1, 15, 58, 14, 321)],
            ['go to see the new movie in 3 days', 'go to see the new movie', new Date(2020, 0, 4, 13, 28, 14, 321)],
            ['in 3 days go to see the new movie ', 'go to see the new movie', new Date(2020, 0, 4, 13, 28, 14, 321)],
            ['party at some place in 2 months', 'party at some place', new Date(2020, 2, 1, 13, 28, 14, 321)],
            ['in 2 months party at some place', 'party at some place', new Date(2020, 2, 1, 13, 28, 14, 321)],
            ['in 6 years be on a big journey', 'be on a big journey', new Date(2026, 0, 1, 13, 28, 14, 321)],

            // on <month> <date> with optional sequence number
            ['see a movie on January 1', 'see a movie', new Date(2021, 0, 1, 0, 0, 0, 0)],
            ['on January 1 see a movie', 'see a movie', new Date(2021, 0, 1, 0, 0, 0, 0)],
            ['go to the party on Apr 2nd', 'go to the party', new Date(2020, 3, 2, 0, 0, 0, 0)],
            ['on Apr 2nd go to the party', 'go to the party', new Date(2020, 3, 2, 0, 0, 0, 0)],
            ['plan the big journey on June 15', 'plan the big journey', new Date(2020, 5, 15, 0, 0, 0, 0)],
            ['on June 15 plan the big journey', 'plan the big journey', new Date(2020, 5, 15, 0, 0, 0, 0)],

            ['go to a foreign country on 9 Feb', 'go to a foreign country', new Date(2020, 1, 9, 0, 0, 0, 0)],
            ['on 9 Feb go to a foreign country ', 'go to a foreign country', new Date(2020, 1, 9, 0, 0, 0, 0)],
            ['celebrate birthday on 15th of September', 'celebrate birthday', new Date(2020, 8, 15, 0, 0, 0, 0)],
            ['on 15th of September celebrate birthday ', 'celebrate birthday', new Date(2020, 8, 15, 0, 0, 0, 0)],

            // on DD.MM.YYYY
            ['write a letter to a colleague on 30.11.2020', 'write a letter to a colleague', new Date(2020, 10, 30, 0, 0, 0, 0)],
            ['on 30.11.2020 write a letter to a colleague', 'write a letter to a colleague', new Date(2020, 10, 30, 0, 0, 0, 0)],
            ['update software on 07.01.2021', 'update software', new Date(2021, 0, 7, 0, 0, 0, 0)],
            ['on 07.01.2021 update software', 'update software', new Date(2021, 0, 7, 0, 0, 0, 0)],
            ['go to the market on 3.2.2022', 'go to the market', new Date(2022, 1, 3, 0, 0, 0, 0)],
            ['on 3.2.2022 go to the market', 'go to the market', new Date(2022, 1, 3, 0, 0, 0, 0)],

            // on DD.MM
            ['go to the market on 3.2', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],
            ['on 3.2 go to the market', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],
            ['go to the market on 03.02', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],
            ['on 03.02 go to the market', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],
            ['go to the market on 03.2', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],
            ['on 03.2 go to the market', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],
            ['go to the market on 03.2', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],
            ['on 03.2 go to the market', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],
            ['go to the market on 3.02', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],
            ['on 3.02 go to the market', 'go to the market', new Date(2020, 1, 3, 0, 0, 0, 0)],

            // Test multi line and markdown parsing
            ['add a `test` *with* **markdown**\n```js\nconsole.log("Hello world!")\n```\nin 17 minutes', 'add a `test` *with* **markdown**\n```js\nconsole.log("Hello world!")\n```', new Date(2020, 0, 1, 13, 45, 14, 321)],
            ['in 17 minutes\nadd a `test` *with* **markdown**\n```js\nconsole.log("Hello world!")\n```', 'add a `test` *with* **markdown**\n```js\nconsole.log("Hello world!")\n```', new Date(2020, 0, 1, 13, 45, 14, 321)],
        ])('should parse %p', (
            input: string,
            expectedMessage: string,
            expectedTime: Date,
        ) => {
            const reminder = new Reminder();
            const result = reminder.parseReminder(input, fromDate);

            if (!result) {
                throw new Error('result is null!');
            }

            expect(result.reminder).toBe(expectedMessage);
            expect(result.dateTime.isSame(expectedTime)).toBe(true);
        });

        test.each([
            ['catch the new episode on Thursday', 'catch the new episode', 4],
            ['go see Tom on Wed', 'go see Tom', 3],
            ['pay the bills on saturday', 'pay the bills', 6],
            ['add more tests on fri', 'add more tests', 5],
        ])('should parse day name correctly for %p', (
            input: string,
            expectedMessage: string,
            dayIndex: number, // see: https://momentjs.com/docs/#/get-set/day/
        ) => {
            const reminder = new Reminder();
            const result = reminder.parseReminder(input, fromDate);

            if (!result) {
                throw new Error('result is null!');
            }

            const today = moment();
            const expectedTime = today
                .day(dayIndex + (today.day() >= dayIndex ? 7 : 0))
                .hour(0)
                .minute(0)
                .second(0)
                .millisecond(0);

            expect(result.reminder).toBe(expectedMessage);
            expect(result.dateTime.isSame(expectedTime)).toBe(true);
        });

        test.each([
            [''],
            ['this should be null on whatever'],
            ['123.421 at XX:XX'],
            ['a random text from someone'],
        ])('should return null on incorrect input', (input: string) => {
            const reminder = new Reminder();

            expect(reminder.parseReminder(input)).toBe(null);
        });
    });
});

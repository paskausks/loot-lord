import moment from 'moment';
import Reminder from '../reminder';
import { reactFail, reactSuccess }  from '../../../utils/discord';

jest.mock('../../../utils/discord', () => ({
    reactFail: jest.fn(),
    reactSuccess: jest.fn(),
}));

function getFakeKnex(): any {
    const knex: any = {
        select: jest.fn(() => knex),
        from: jest.fn(() => knex),
        where: jest.fn(() => knex),
        del: jest.fn(() => 1 /* return rows affected */),
        orderBy: jest.fn(() => Promise.resolve([
            // Return fake reminder
            {
                id: 'somenumericid',
            },
        ])),
    };

    return knex;
}

function getReminderConstructorOpts(): any {
    const plugins: Map<string, any> = new Map();

    // mock pulse plugin which reminder depends on.
    plugins.set('pulse', {
        subscribe: () => null,
    });

    return {
        plugins,
    }
}

describe('Reminder', () => {

    beforeEach(() => {
        (reactFail as jest.MockedFunction<typeof reactFail>).mockClear();
        (reactSuccess as jest.MockedFunction<typeof reactSuccess>).mockClear();
    });

    afterAll(() => {
        (reactFail as jest.MockedFunction<typeof reactFail>).mockRestore();
        (reactSuccess as jest.MockedFunction<typeof reactSuccess>).mockRestore();
    });

    describe('Reminder.new', () => {
        it('should register an observer to the pulse plugin', () => {
            const opts = getReminderConstructorOpts();
            const subscribeFn = jest.fn();
            opts.plugins.get('pulse').subscribe = subscribeFn;

            new Reminder(opts);

            expect(subscribeFn).toBeCalled();
        });
    });

    describe('Reminder#exec', () => {
        test.each([
            [[]],
            [['help']],
        ])(
        'should return help with the args %p',
        async (args: string[]) => {
            const reminder = new Reminder(getReminderConstructorOpts());
            const spy = jest.spyOn(reminder, 'sendHelp');
            const message = {
                msg: {
                    channel: {
                        send: () => null,
                    },
                },
                args,
            } as any;

            reminder.exec(message);

            expect(spy).toBeCalledWith(message.msg);
        });

        it('should inform the user if they have given an invalid sub-command', async () => {
            const reminder = new Reminder(getReminderConstructorOpts());
            const sendFn = jest.fn();
            const message = {
                msg: {
                    channel: {
                        send: sendFn,
                    },
                },
                args: ['foobar']
            } as any;

            await reminder.exec(message);
            expect(sendFn).toBeCalledWith('Invalid subcommand. Try: `add`, `rm`, `list`, `help`');
        });

        describe('reminder removal', () => {
            const failMsg = 'Invalid reminder number. Check again with the `reminder list` command!';

            it('should return an error if not an integer has been passed', async () => {
                const reminder = new Reminder(getReminderConstructorOpts());
                const message = {
                    msg: {
                        channel: {
                            send: () => null,
                        },
                    },
                    args: ['rm', 'foo'],
                } as any;

                await reminder.exec(message);
                expect(reactFail).toBeCalledWith(message.msg, failMsg);
            });

            it('should return an error if the provided reminder does not exist', async () => {
                const reminder = new Reminder(getReminderConstructorOpts());
                const knex: any = getFakeKnex();
                const message = {
                    msg: {
                        channel: {
                            send: () => null,
                        },
                        author: {
                            id: 'foo',
                        },
                    },
                    args: ['rm', '99'],
                    knex,
                } as any;

                await reminder.exec(message);

                // Test reminder#getAll as well
                expect(knex.select).toBeCalled();
                expect(knex.from).toBeCalledWith('reminders');
                expect(knex.where).toBeCalledWith('user_id', 'foo');
                expect(knex.orderBy).toBeCalledWith('reminder_at', 'asc');

                expect(reactFail).toBeCalledWith(message.msg, failMsg);
            });

            it('should notify the user if something went wrong', async () => {
                const reminder = new Reminder(getReminderConstructorOpts());
                const knex = getFakeKnex();
                knex.del = () => 0; // return 0 rows affected on deletion
                const message = {
                    msg: {
                        channel: {
                            send: () => null,
                        },
                        author: {
                            id: 'foo',
                        },
                    },
                    args: ['rm', '1'], // Return the first and only fake reminder
                    knex,
                } as any;

                await reminder.exec(message);
                expect(reactFail).toBeCalledWith(message.msg, 'Something went wrong.');
            });

            it('should remove the given reminder', async () => {
                const reminder = new Reminder(getReminderConstructorOpts());
                const knex = getFakeKnex();
                const message = {
                    msg: {
                        channel: {
                            send: () => null,
                        },
                        author: {
                            id: 'foo',
                        },
                    },
                    args: ['rm', '1'], // Return the first and only fake reminder
                    knex,
                } as any;

                await reminder.exec(message);

                expect(knex.where).toHaveBeenLastCalledWith('id', 'somenumericid');
                expect(knex.del).toBeCalled();
                expect(knex.orderBy).toBeCalledWith('reminder_at', 'asc');

                expect(reactSuccess).toBeCalledWith(message.msg);
            });
        });

        describe('reminder addition', () => {
            it('should return a message on incorrectly passed reminder syntax', async () => {
                const reminder = new Reminder(getReminderConstructorOpts());
                const message = {
                    msg: {
                        channel: {
                            send: () => null,
                        },
                    },
                    args: 'add It was a dark and stormy night'.split(' '),
                } as any;

                await reminder.exec(message);
                expect(reactFail).toBeCalledWith(
                    message.msg,
                    'Your syntax is incorrect. Check the command help and try again!',
                );
            });

            it('should return a message on a reminder message that is too long', async () => {
                const reminder = new Reminder(getReminderConstructorOpts());
                const message = {
                    msg: {
                        channel: {
                            send: () => null,
                        },
                    },
                    args: ['add', 'in', '1', 'minute'].concat(new Array(126).fill('a')),
                } as any;

                await reminder.exec(message);
                expect(reactFail).toBeCalledWith(
                    message.msg,
                    'Your reminder is too long. It has 251 characters, '
                    + 'but should not exceed 250!'
                );
            });

            it('should insert the reminder into the database', async () => {
                const reminder = new Reminder(getReminderConstructorOpts());
                const insertFn = jest.fn();
                const knex = jest.fn(() => ({
                    insert: insertFn,
                }));
                const message = {
                    msg: {
                        channel: {
                            send: () => null,
                        },
                        author: {
                            id: 'reminderauthorid'
                        },
                        url: 'https://example.com/123',
                    },
                    knex,
                    args: 'add run tests in 1 minute'.split(' '),
                } as any;

                await reminder.exec(message);

                // Don't check the date time, just check the other args.
                const insertArg = insertFn.mock.calls[0][0];
                expect(knex).toBeCalledWith('reminders');
                expect(insertArg.user_id).toBe('reminderauthorid');
                expect(insertArg.reminder).toBe('run tests');
                expect(insertArg.reminder_url).toBe('https://example.com/123');
                expect(insertArg.reminder_at).not.toBeUndefined();
                expect(
                    (reactSuccess as jest.MockedFunction<typeof reactSuccess>
                ).mock.calls[0][1]).toContain('Your reminder has been added! I\'ll notify you about it at');
            });
        });

        describe('reminder listing', () => {
            it('should tell the user if there are no reminders', async () => {
                const reminder = new Reminder(getReminderConstructorOpts());
                const knex = getFakeKnex();
                const sendFn = jest.fn();
                knex.orderBy = jest.fn(() => []);

                const message = {
                    msg: {
                        channel: {
                            send: sendFn,
                        },
                        author: {
                            id: 'xxx',
                        },
                    },
                    knex,
                    args: ['list'],
                } as any;

                await reminder.exec(message);

                expect(knex.where).toBeCalledWith('user_id', 'xxx');
                expect(sendFn).toBeCalledWith('You currently don\'t have any reminders.');
            });

            it('should list the user\'s reminders', async () => {
                const reminder = new Reminder(getReminderConstructorOpts());
                const knex = getFakeKnex();
                const sendFn = jest.fn();
                const reminder_at = new Date().getTime();
                knex.orderBy = jest.fn(() => [
                    { reminder_at, reminder: 'walk dog' },
                    { reminder_at, reminder: 'go to store' },
                ]);

                const message = {
                    msg: {
                        channel: {
                            send: sendFn,
                        },
                        author: {
                            id: 'xxx',
                        },
                    },
                    knex,
                    args: ['list'],
                } as any;

                await reminder.exec(message);

                const sentEmbed = sendFn.mock.calls[0][0].embed;
                expect(sentEmbed.title).toBe('Your reminders');
                expect(sentEmbed.description).toBe('All times shown in UTC.\n\n');
                expect(sentEmbed.fields[0].value).toBe('walk dog');
                expect(sentEmbed.fields[1].value).toBe('go to store');

                // Don't check the dates of the reminders, just check
                // that they're there.
                expect(typeof sentEmbed.fields[0].name).toBe('string');
                expect(typeof sentEmbed.fields[1].name).toBe('string');
            });
        });
    });

    describe('Reminder#parseReminder', () => {
        // Set a constant time for testing the parser
        // so we can check with someMoment.isSame('')
        const fromDate = new Date(2020, 0, 1, 13, 28, 14, 321); // a Wednesday

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
            const result = Reminder.parseReminder(input, fromDate);

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
            const result = Reminder.parseReminder(input, fromDate);

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
            expect(Reminder.parseReminder(input)).toBe(null);
        });
    });
});

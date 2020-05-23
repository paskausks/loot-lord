import moment from 'moment';
import { isValidSequenceNumber } from '../../utils/number';

/**
 * A successful result returned by a reminder message parser function.
 */
export interface ParseResult {
    dateTime: moment.Moment;
    reminder: string;
}

/**
 * A type which defines a message parser function.
 */
export type ReminderMessageParser = (
    message: string,
    sourceDate: moment.Moment
) => ParseResult | null;

/*
 * Message parsers add support for various
 * message formats through which reminders
 * can be created.
 */
const parsers: ReminderMessageParser[] = [
    /*
     * Messages starting with "in"
     * e.g. "in 3 hours", "in 5 days", etc.
     */
    (message, sourceDate) => {
        const result = /([\s\S]+)in (\d+\.?\d*) ([a-zA-Z]+)$/.exec(message);
        const targetTime = sourceDate.clone();

        if (!result) {
            return null;
        }

        const reminder = result[1].trim();
        const amount = parseFloat(result[2]);
        const type = result[3];

        if (Number.isNaN(amount)) {
            throw new Error('Not a valid time amount!');
        }

        targetTime.add(amount, type as moment.DurationInputArg2);
        if (sourceDate.isSame(targetTime)) {
            // "add" operation failed, time was unmodified.
            return null;
        }

        return {
            dateTime: targetTime,
            reminder,
        };
    },

    /*
     * Messages with the format "on <month> <date>" and "on <date> <month>"
     * e.g. "on January 1", "on March 4th", "on Jun 22", "on 1 January",
     * "on 3rd April", "on 14th of Nov" etc.
     */
    (message, sourceDate) => {
        let result = /([\s\S]+)on ([a-zA-Z]{2,}) (\d+)(st|nd|rd|th)?$/.exec(message);
        let month: string;
        let date: number;
        let suffix: string | undefined;

        /* eslint-disable prefer-destructuring */
        if (result) {
            month = result[2];
            date = parseInt(result[3], 10);
            suffix = result[4];
        } else {
            // Try reversed
            result = /([\s\S]+)on (\d+)(st|nd|rd|th)? (?:of )?([a-zA-Z]{3,})/.exec(message);

            if (!result) {
                return null;
            }

            date = parseInt(result[2], 10);
            suffix = result[3];
            month = result[4];
        }
        /* eslint-enable prefer-destructuring */

        const reminder = result[1].trim();

        if (Number.isNaN(date)) {
            return null;
        }

        if (suffix && !isValidSequenceNumber(date + suffix)) {
            return null;
        }

        const newDate = moment(date.toString() + month, [
            'DMMM', // 1Mar
            'DMMMM', // 1March
            'DDMMM', // 01Mar
            'DDMMMM', // 01March
        ], true);

        if (!newDate.isValid()) {
            return null;
        }

        return {
            dateTime: newDate.isBefore(sourceDate) ? newDate.add(1, 'y') : newDate,
            reminder,
        };
    },

    /*
     * Messages with the format "on DD.MM.YYYY"
     * and "DD.MM" e.g. "12.03.2020", "12.4.2020", "1.03.20",
     * "14.02", "1.2" etc.
     */
    (message, sourceDate) => {
        const result = /([\s\S]+)on (\d{1,2}\.\d{1,2}(:?\.\d{2}|\.\d{4})?)\.?$$/.exec(message);

        if (!result) {
            return null;
        }

        const reminder = result[1].trim();
        const newDate = moment(result[2], [
            'D.M.YYYY',
            'D.M.YY',
            'D.M',
        ], true);

        if (!newDate.isValid() || newDate.isBefore(sourceDate)) {
            return null;
        }

        return {
            dateTime: newDate,
            reminder,
        };
    },

    /*
     * Messages with the format "on <day>"
     * e.g. "Mon", "Tue", "Thursday", etc.
     * etc.
     */
    (message) => {
        const result = /([\s\S]+)on ([a-zA-Z]{3,9})$/.exec(message);

        if (!result) {
            return null;
        }

        const reminder = result[1].trim();
        const newDate = moment(result[2], [
            'ddd', // Mon, Tue, Wed, etc.
            'dddd', // Monday, Tuesday, etc.
        ], true);

        if (!newDate.isValid()) {
            return null;
        }

        return {
            dateTime: newDate.isBefore(new Date()) ? newDate.add(1, 'week') : newDate,
            reminder,
        };
    },
];

export default parsers;

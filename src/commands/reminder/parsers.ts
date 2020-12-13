import moment from 'moment';
import { isValidSequenceNumber } from '../../utils/number';

/**
 * A successful result returned by a reminder message parser function.
 */
interface ParseResult {
    dateTime: moment.Moment;
    reminder: string;
}

type ReminderMessageParserResult = ParseResult | null;

/**
 * A type which defines a message parser function.
 */
type ReminderMessageParser = (
    message: string,
    sourceDate: moment.Moment
) => ReminderMessageParserResult;

/**
 * Performs a RegExp exec on a message,
 * utilizing the provided regexp pattern for
 * time.
 *
 * By default this pattern is "<message> <time descriptor>",
 * but it can also be reversed.
 */
function execReminderMessage(
    message: string,
    timePattern: string,
    reversed = false,
): RegExpExecArray | null {
    const REMINDER_MESSAGE_PATTERN = '([\\s\\S]+)';
    let regexp: RegExp;

    if (reversed) {
        regexp = new RegExp(`^${timePattern}\\s${REMINDER_MESSAGE_PATTERN}$`);
    } else {
        regexp = new RegExp(`^${REMINDER_MESSAGE_PATTERN}\\s${timePattern}$`);
    }

    return regexp.exec(message);
}

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
    (message: string, sourceDate: moment.Moment): ReminderMessageParserResult => {
        const time = 'in (\\d+\\.?\\d*) ([a-zA-Z]+)';
        let result = execReminderMessage(message, time);
        let rawReminder: string;
        let rawAmount: string;
        let rawType: string;
        const targetTime = sourceDate.clone();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let full: string;

        if (result) {
            [full, rawReminder, rawAmount, rawType] = result;
        } else {
            // Try reversed
            result = execReminderMessage(message, time, true);

            if (!result) {
                return null;
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [full, rawAmount, rawType, rawReminder] = result;
        }

        const reminder = rawReminder.trim();
        const amount = parseFloat(rawAmount);
        const unit = rawType;

        if (Number.isNaN(amount)) {
            throw new Error('Not a valid time amount!');
        }

        targetTime.add(amount, unit as moment.DurationInputArg2);
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
    (message: string, sourceDate: moment.Moment): ReminderMessageParserResult => {
        const timeDefault = 'on ([a-zA-Z]{2,}) (\\d+)(st|nd|rd|th)?';
        const timeAlt = 'on (\\d+)(st|nd|rd|th)? (?:of )?([a-zA-Z]{3,})';
        let result = execReminderMessage(message, timeDefault);
        let rawReminder = '';
        let rawMonth = '';
        let rawDate = '';
        let rawSuffix = '';
        let regularMatch = false;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let full: string;

        if (result) {
            [full, rawReminder, rawMonth, rawDate, rawSuffix] = result;
            regularMatch = true;
        } else {
            // Try alternative date format
            result = execReminderMessage(message, timeAlt);

            if (result) {
                regularMatch = true;
                [full, rawReminder, rawDate, rawSuffix, rawMonth] = result;
            }
        }

        if (!regularMatch) {
            // try time in front
            result = execReminderMessage(message, timeDefault, true);

            if (result) {
                [full, rawMonth, rawDate, rawSuffix, rawReminder] = result;
            } else {
                // try time in front with alternative date format
                result = execReminderMessage(message, timeAlt, true);

                if (!result) {
                    return null;
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                [full, rawDate, rawSuffix, rawMonth, rawReminder] = result;
            }
        }

        const reminder = rawReminder.trim();
        const month = rawMonth;
        const date = parseInt(rawDate, 10);
        const suffix = rawSuffix;

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
    (message: string, sourceDate: moment.Moment): ReminderMessageParserResult => {
        const time = 'on (\\d{1,2}\\.\\d{1,2}(?:\\.\\d{4})?)\\.?';
        let result = execReminderMessage(message, time);
        let rawReminder: string;
        let rawDate: string;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let full: string;

        if (result) {
            [full, rawReminder, rawDate] = result;
        } else {
            // Try reversed
            result = execReminderMessage(message, time, true);

            if (!result) {
                return null;
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [full, rawDate, rawReminder] = result;
        }

        const reminder = rawReminder.trim();
        const newDate = moment(rawDate, [
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
    (message: string): ReminderMessageParserResult => {
        const time = 'on ([a-zA-Z]{3,9})';
        let result = execReminderMessage(message, time);
        let rawReminder: string;
        let rawDay: string;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let full: string;

        if (result) {
            [full, rawReminder, rawDay] = result;
        } else {
            // try reverse
            result = execReminderMessage(message, time, true);

            if (!result) {
                return null;
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [full, rawDay, rawReminder] = result;
        }

        const reminder = rawReminder.trim();
        const newDate = moment(rawDay, [
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

export {
    parsers as default,
    execReminderMessage,
    ParseResult,
    ReminderMessageParser,
};

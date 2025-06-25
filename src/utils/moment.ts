import moment from 'moment';

/**
 * Get a knex timestamp and convert it to a local time moment
 */
export function getMoment(dateString: string): moment.Moment {
    return moment
        .utc(dateString)
        .local();
}

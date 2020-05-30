import moment from 'moment';

/**
 * Get a knex timestamp and convert it to a local time moment
 */
// eslint-disable-next-line import/prefer-default-export
export function getMoment(dateString: string): moment.Moment {
    return moment
        .utc(dateString)
        .local();
}

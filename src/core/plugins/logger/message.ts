import signale from 'signale';

export default interface LoggerMessage {
    message: string;
    level?: signale.DefaultMethods;
}

export const LOGGER_SUBJECT_KEY = 'logger';
export { DefaultMethods as levels } from 'signale';

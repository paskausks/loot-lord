import SimpleCommand from './simple-command';
import Help from './help';
import BaseCommand from './base';

export interface CommandMap {
    [key: string]: BaseCommand;
}

export default {
    command: new SimpleCommand(),
    help: new Help(),
} as CommandMap;

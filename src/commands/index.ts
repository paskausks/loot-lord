import SimpleCommand from './simple-command';
import Reminder from './reminder';
import Help from './help';
import BaseCommand from './base';
import About from './about';

export interface CommandMap {
    [key: string]: BaseCommand;
}

export default {
    command: new SimpleCommand(),
    reminder: new Reminder(),
    help: new Help(),
    about: new About(),
} as CommandMap;

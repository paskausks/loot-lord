import SimpleCommand from './simple-command';
import Reminder from './reminder';
import Help from './help';
import BaseCommand from './base';
import About from './about';
import Uptime from './uptime';

export interface CommandMap {
    [key: string]: BaseCommand;
}

export default {
    command: new SimpleCommand(),
    reminder: new Reminder(),
    help: new Help(),
    about: new About(),
    uptime: new Uptime(),
} as CommandMap;

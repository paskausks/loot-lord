import SimpleCommand from './simple-command';
import FriendlyFire from './friendlyfire';
import Help from './help';
import BaseCommand from './base';

export interface CommandMap {
    [key: string]: BaseCommand;
}

export default {
    friendly: new FriendlyFire(),
    command: new SimpleCommand(),
    help: new Help(),
} as CommandMap;

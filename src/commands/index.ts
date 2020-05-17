import SimpleCommand from './simple-command';
import Reminder from './reminder';
import Help from './help';
import BaseCommand from './base';
import About from './about';
import Uptime from './uptime';
import Roll from './roll';
import React from './react';

export interface CommandMap {
    [key: string]: BaseCommand;
}

export default {
    command: new SimpleCommand(),
    reminder: new Reminder(),
    help: new Help(),
    about: new About(),
    uptime: new Uptime(),
    roll: new Roll(),
    react: new React(),
} as CommandMap;

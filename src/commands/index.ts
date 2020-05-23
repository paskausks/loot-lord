import SimpleCommand from './simple-command';
import Reminder from './reminder';
import Help from './help';
import BaseCommand from './base';
import About from './about';
import Uptime from './uptime';
import Roll from './roll';
import React from './react';

export type CommandMap = Map<string, BaseCommand>;
const commandMap: CommandMap = new Map();

[
    Help,
    About,
    Uptime,
    SimpleCommand,
    Reminder,
    Roll,
    React,
].map((CommandClass) => new CommandClass()).forEach((commandInstance) => {
    commandMap.set(commandInstance.trigger.toLowerCase(), commandInstance);
});

export default commandMap;

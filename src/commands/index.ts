import SimpleCommand from './simple-command';
import Reminder from './reminder';
import Help from './help';
import About from './about';
import Uptime from './uptime';
import Roll from './roll';
import React from './react';

const commands = [
    Help,
    SimpleCommand,
    Reminder,
    Roll,
    React,
    About,
    Uptime,
];

export default commands;
export { default as Command } from './base';

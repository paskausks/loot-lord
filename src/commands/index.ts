import SimpleCommand from './simple-command';
import Reminder from './reminder';
import Help from './help';
import About from './about';
import Uptime from './uptime';
import Roll from './roll';
import React from './react';
import Quote from './quote';
import ChatGPT from './chatgpt';
import Counter from './counter';

const commands = [
    Help,
    SimpleCommand,
    Reminder,
    Roll,
    React,
    Quote,
    About,
    Uptime,
    ChatGPT,
    Counter,
];

export default commands;
export { default as Command } from './base';

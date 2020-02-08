import Foo from './foo';
import Help from './help';
import BaseCommand from './base';

interface CommandMap {
    [key: string]: BaseCommand;
}

export default {
    foo: new Foo(),
    help: new Help(),
} as CommandMap;

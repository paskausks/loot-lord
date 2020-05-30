# Loot Lord
A discord bot of sorts.

## Requirements

* Node.js 12+

## Setup

Install dependencies.

```
npm install
```

Run migrations.

```
npm run knex migrate:latest
```

Create a [discord bot account](https://discordapp.com/developers/applications), create a bot user for the application, get it's token, set it in _.env.sample_ file and save it as _.env_.

Invite the bot into a server of your choosing:

[https://discordapp.com/api/oauth2/authorize?client_id=CLIENTIDHERE&scope=bot&permissions=519232](https://discordapp.com/api/oauth2/authorize?client_id=CLIENTIDHERE&scope=bot&permissions=519232)

Build the bot and start it:

```
npm run build && npm start
```

## Commands

Run tests

```
npm test
```

Rerun tests on changes

```
npm test:watch
```

Run tests and collect coverage

```
npm test:coverage
```

Build sources

```
npm run build
```

Run the built files.

```
npm start
```

Build sources and watch for changes

```
npm run build:watch
```

Run the linter

```
npm run lint
```

Run the linter and auto-fix issues

```
npm run lint:fix
```

## Extending

The bot has a public API of sorts, although it's expected to be very unstable, since it's also used internally. Here's some example code:

```javascript
const { bootstrap, Plugin, Command } = require('./path/to/loot-lord');

/**
 * A very simple plugin example.
 */
class ExamplePlugin extends Plugin {
    constructor(opts) {
        super(opts);

        opts.ready.subscribe((client) => {
            // `client` is the discord.js Client instance.
            this.log('Bot connected. Hello from test plugin!', 'success');
        });

        opts.commandMessages.subscribe(({ message, command, args }) => {
            // `message` is a discord.js Message instance,
            console.log('The bot received a command', command, args);
        });
    }
}

/**
 * A simple command example.
 */
class ExampleCommand extends Command {
    // The command will be called with "sample"
    trigger = 'sample';

    exec(ctx) {
        // `knex` is an instance of knex,
        // which has access to the sqlite database.
        const { msg, knex, args } = ctx;

        switch(args[0]) {
            // !sample foo
            case 'foo': {
                msg.channel.send(new Date().toLocaleString());
                break;
            }
            // !sample bar
            case 'bar': {
                msg.channel.send(Math.random().toString());
                break;
            }

            // !sample
            default: {
                msg.channel.send('Hello!');
            }
        }
    }
}

bootstrap([
    ExamplePlugin,
    ExampleCommand,
]).then((client) => {
    client.login('YOURDISCORDBOTTOKEN');
});
```

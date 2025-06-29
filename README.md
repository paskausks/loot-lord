# Loot Lord

![Master](https://github.com/paskausks/loot-lord/workflows/Master/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/paskausks/loot-lord/badge.svg?branch=master)](https://coveralls.io/github/paskausks/loot-lord?branch=master)

A discord bot of sorts.

## Requirements

* Node.js v22+

## Setup

Install dependencies.

```
npm install
```

Perform migrations.

```
npm run migrate
```

Create a [discord bot account](https://discordapp.com/developers/applications), create a bot user for the application, make sure it has all Privileged Gateway Intents enabled. Get it's token, set it in _.env.sample_ file and save it as _.env_.

Invite the bot into a server of your choosing:

[https://discordapp.com/api/oauth2/authorize?client_id=CLIENTIDHERE&scope=bot&permissions=519232](https://discordapp.com/api/oauth2/authorize?client_id=CLIENTIDHERE&scope=bot&permissions=519232)

Build the bot and start it:

```
npm run build && npm start
```

### ChatGPT functionality

The bot has optional ChatGPT functionality via OpenAI's API. If you'd like to use it, set these relevant environment variables:

* `DISCORD_BOT_OPENAI_API_KEY` - a valid OpenAI API key.
* `DISCORD_BOT_OPENAI_MODEL` - the model to use. `gpt-4.1-mini` recommended as a good speed/quality balance.
* `DISCORD_BOT_OPENAI_INSTRUCTIONS_PATH` - a path to a text file which will be sent as the instruction block.

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

Perform database migrations

```
npm run migrate
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

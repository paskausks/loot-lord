# Loot Lord
A discord bot of sorts.

## Requirements

* Node.js 10+

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

## Running

Run tests

```
npm run test
```

Build sources

```
npm run build
```

Run the built files.

```
npm run start
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

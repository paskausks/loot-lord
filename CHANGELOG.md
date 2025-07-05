# Changelog

## [Unreleased]

* Added: using a custom sqlite database path, settable via the `DISCORD_BOT_DB` environment variable. If unset, it'll fall back to `data.sqlite3` to preserve previous behavior.
* Added: Dockerfile with instructions for containerized deployment.

## [v0.6.1]

* Added: max token output limit for ChatGPT, so it doesn't go over the discord text channel message limit.
* Fixed: ChatGPT messages longer than the discord text channel message limit will be trimmed.
* Fixed: for ChatGPT, if a reply is to the bot itself, don't include the message replied to in the prompt as its redundant and not recommended.
* Added: ChatGPT plugin subcommand `!g sys` to pass privileged system-role prompts. Use `!g sys <prompt>` for debugging or administration. These are restricted to select user ids, definable as a comma-separated list in the `DISCORD_BOT_OPENAI_SYS_USERIDS` environment variable.
* Added: ChatGPT plugin subcommand `!g reset` which cuts off the current conversation thread and starts a new one using the summary of the current thread as the start of the newly created conversation. Any user can reset the conversation in their DMs with the bot, but for resetting public server threads, the requesting user id has to be included in `DISCORD_BOT_OPENAI_SYS_USERIDS`.

## [v0.6.0]

* Added: Counter system via the `!cnt` command.

## [v0.5.1]

* Added: rudimentary Discord embed parsing to the ChatGPT Plugin.
* Fixed: the ChatGPT plugin didn't parse links wrapped in angle brackets (`<>`).
* Added: include channel name for ChatGPT prompts originating in public channels.
* Added: discord message character limit to ChatGPT instructions.
* Added: send typing signal while processing ChatGPT prompt.
* Fixed: ChatGPT prompt header was incorrectly sent.

## [v0.5.0]

* Added: optional ChatGPT plugin. To use, set the `DISCORD_BOT_OPENAI_API_KEY` environment variable to a valid API key.
* Updated: most of the packages of the project and raise the minimum NodeJS version to v22.

## [v0.4.0]

* Added: Command ignore list, using `!command ignore` and `!command unignore`. Useful if you are running multiple bots, using the same prefix
* Fixed: fixed where the dice roll command didn't work (e.g. `!roll d20`) and where "help" couldn't be the first of multiple choices (e.g. `!roll help foo bar`), because the help dialog would be shown instead.

## [v0.3.0]

* Added: Quote system, using `!quote`.
* Added: The bot now has a public API, so the functionality of the bot can be extended, although, for now, the API is going to be super unstable while the project is this immature.
* Added: Help responses now look a bit prettier.
* Fixed: If a single argument is passed to the `!roll` command and it's not a number, an error message is returned.
* Added: `!react` command.
* Added: Reversed syntax ("<when> <what>", e.g. `!reminder add on friday beers with the boys`) for reminders and also a "DD.MM" format.

## [v0.2.0]

* Fixed: Fixed where it was possible to create a simple command using a built-in command's name (e.g. `!command add command ...`)
* Fixed: Exception when a command was sent to the bot via DM.
* Added: Reminder system via the `!reminders` command.
* Added: If a subcommand is missing, help will be displayed for that particular command.
* Added: The `!help` command now shows commands with available help.
* Added: The help output for commands includes the command prefix.
* Added: `!about`, `!uptime` and `!roll` commands.

## [v0.1.0]

* Initial release.

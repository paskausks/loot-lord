# Changelog

## [Unreleased]

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

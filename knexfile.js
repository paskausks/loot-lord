const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DISCORD_BOT_DB || 'data.sqlite3',
      timezone: 'UTC',
    },
    useNullAsDefault: true
  },
};

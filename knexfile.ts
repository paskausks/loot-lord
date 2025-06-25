module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: './data.sqlite3',
      timezone: 'UTC',
    },
    useNullAsDefault: true
  },
};

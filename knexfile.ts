module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './data.sqlite3',
      timezone: 'UTC',
    },
    useNullAsDefault: true
  },
};

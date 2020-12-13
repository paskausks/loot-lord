const tableName = 'ignoredcommands';

exports.up = async function(knex) {
    await knex.schema.createTable(tableName, (table) => {
        table.string('command', 50).primary();
        table.string('ignorer_id', 32).notNullable();
        table.timestamps(true, true);
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTable(tableName);
};

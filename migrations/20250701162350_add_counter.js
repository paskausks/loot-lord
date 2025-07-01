exports.up = async function(knex) {
    await knex.schema.createTable('counter', (table) => {
        table.string('key', 100).primary();
        table.integer('count', 8).notNullable();
        table.timestamps(true, true);
    });
}

exports.down = async function(knex) {
    await knex.schema.dropTable('counter');
}


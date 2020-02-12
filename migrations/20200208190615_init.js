exports.up = async function(knex) {
    await knex.schema.createTable('friendlyfire', (table) => {
        table.increments();
        table.bigInteger('killer_id');
        table.bigInteger('victim_id');
        table.timestamps(true, true);
    })

    await knex.schema.createTable('simplecommands', (table) => {
        table.string('command', 50).primary();
        table.string('response', 1000);
        table.timestamps(true, true);
    })
};

exports.down = async function(knex) {
    await knex.schema.dropTable('friendlyfire');
    await knex.schema.dropTable('simplecommands');
};

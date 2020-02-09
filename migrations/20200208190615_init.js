exports.up = async function(knex) {
    await knex.schema.createTable('friendlyfire', (table) => {
        table.increments();
        table.bigInteger('killer_id');
        table.bigInteger('victim_id');
        table.timestamps();
    })

    await knex.schema.createTable('simplecommands', (table) => {
        table.string('command').primary();
        table.string('response');
        table.timestamps();
    })
};

exports.down = async function(knex) {
    await knex.schema.dropTable('friendlyfire');
    await knex.schema.dropTable('simplecommands');
};

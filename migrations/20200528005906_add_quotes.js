const tableName = 'quotes';

exports.up = async function(knex) {
    await knex.schema.createTable(tableName, (table) => {
        table.increments();
        table.string('author_id', 32).notNullable();
        table.string('nominee_id', 32).notNullable();
        table.string('message_id', 32).notNullable();
        table.string('message').notNullable();
        table.string('message_url').notNullable();
        table.boolean('accepted').default(false);
        table.timestamps(true, true);

        table.index('message_id');
    })
};

exports.down = async function(knex) {
    await knex.schema.dropTable(tableName);
};

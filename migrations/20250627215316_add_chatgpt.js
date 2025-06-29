exports.up = async function(knex) {
    await knex.schema.createTable('chatgpt', (table) => {
        table.string('entity_id', 100).primary(); // a composite id, like `g:123123` or `a:123123`
        table.string('previous_response_id', 64).notNullable();
        table.timestamps(true, true);
    });
}

exports.down = async function(knex) {
    await knex.schema.dropTable('chatgpt');
}


exports.up = async function(knex) {
    await knex.schema.createTable('reminders', (table) => {
        table.increments();
        table.string('user_id', 32).notNullable();
        table.string('reminder').notNullable();
        table.datetime('reminder_at', { useTz: true })
        table.boolean('complete').defaultTo(false);
        table.timestamps(true, true);

        table.index('user_id');
    })
};

exports.down = async function(knex) {
    await knex.schema.dropTable('reminders');
};

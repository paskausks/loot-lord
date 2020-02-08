
exports.up = async function(knex) {
    await knex.schema.createTable('friendlyfire', function (table) {
        table.increments();
        table.bigInteger('killer_id');
        table.bigInteger('victim_id');
        table.timestamps();
    })
};

exports.down = async function(knex) {
    await knex.schema.dropTable('friendlyfire');
};

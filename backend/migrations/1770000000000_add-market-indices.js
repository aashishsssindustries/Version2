/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // Create market_indices table
    pgm.createTable('market_indices', {
        id: { type: 'uuid', default: pgm.func('gen_random_uuid()'), primaryKey: true },
        name: { type: 'varchar(100)', notNull: true, unique: true },
        symbol: { type: 'varchar(50)' },
        type: { type: 'varchar(50)' },
        description: { type: 'text' },
        created_at: { type: 'timestamp', default: pgm.func('now()') }
    });

    // Create market_index_history table
    pgm.createTable('market_index_history', {
        id: { type: 'uuid', default: pgm.func('gen_random_uuid()'), primaryKey: true },
        index_id: { type: 'uuid', references: 'market_indices', onDelete: 'CASCADE' },
        date: { type: 'date', notNull: true },
        value: { type: 'decimal(15, 2)', notNull: true },
        created_at: { type: 'timestamp', default: pgm.func('now()') }
    });

    // Add unique constraint
    pgm.addConstraint('market_index_history', 'market_index_history_index_id_date_key', {
        unique: ['index_id', 'date']
    });

    // Add benchmark_index_id to holding_metadata
    pgm.addColumns('holding_metadata', {
        benchmark_index_id: { type: 'uuid', references: 'market_indices', onDelete: 'SET NULL' }
    });
};

exports.down = pgm => {
    pgm.dropColumns('holding_metadata', ['benchmark_index_id']);
    pgm.dropTable('market_index_history');
    pgm.dropTable('market_indices');
};

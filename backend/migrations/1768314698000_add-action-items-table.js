exports.up = (pgm) => {
    pgm.createTable('action_items', {
        id: 'id',
        user_id: {
            type: 'uuid',
            notNull: true,
            references: 'users(id)',
            onDelete: 'CASCADE'
        },
        risk_type: { type: 'varchar(100)' },
        severity: { type: 'varchar(50)' },
        gap_amount: { type: 'numeric(15,2)', default: 0 },
        estimated_score_impact: { type: 'integer', default: 0 },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    // Add index for faster lookups
    pgm.createIndex('action_items', 'user_id');
};

exports.down = (pgm) => {
    pgm.dropTable('action_items');
};

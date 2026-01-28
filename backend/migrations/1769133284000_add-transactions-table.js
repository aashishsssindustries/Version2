/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Table: portfolio_transactions (Transaction history from CAS)
    pgm.createTable('portfolio_transactions', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        portfolio_id: {
            type: 'uuid',
            notNull: true,
            references: '"user_portfolios"',
            onDelete: 'CASCADE'
        },
        isin: {
            type: 'varchar(12)',
            notNull: true
        },
        transaction_date: { type: 'date', notNull: true },
        transaction_type: {
            type: 'varchar(20)',
            notNull: true,
            check: "transaction_type IN ('BUY', 'SELL', 'SIP', 'SWITCH_IN', 'SWITCH_OUT', 'DIVIDEND', 'REDEMPTION')"
        },
        units: { type: 'decimal(20,4)', notNull: true },
        amount: { type: 'decimal(15,2)', notNull: true },
        nav: { type: 'decimal(15,4)' },
        folio: { type: 'varchar(50)' },
        source: {
            type: 'varchar(20)',
            notNull: true,
            default: "'CAS'"
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    // Indexes
    pgm.createIndex('portfolio_transactions', 'portfolio_id');
    pgm.createIndex('portfolio_transactions', 'isin');
    pgm.createIndex('portfolio_transactions', 'transaction_date');

    // Unique constraint for duplicate detection
    pgm.addConstraint('portfolio_transactions', 'unique_transaction', {
        unique: ['portfolio_id', 'isin', 'transaction_date', 'transaction_type', 'units', 'amount']
    });
};

exports.down = (pgm) => {
    pgm.dropTable('portfolio_transactions');
};

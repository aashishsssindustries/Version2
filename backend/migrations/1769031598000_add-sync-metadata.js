/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Add sync metadata columns to user_portfolios table
    pgm.addColumns('user_portfolios', {
        last_synced_at: {
            type: 'timestamptz',
            default: null
        },
        sync_status: {
            type: 'varchar(20)',
            default: null,
            check: "sync_status IS NULL OR sync_status IN ('SUCCESS', 'PARTIAL', 'FAILED')"
        },
        sync_source: {
            type: 'varchar(20)',
            default: null,
            check: "sync_source IS NULL OR sync_source IN ('MANUAL', 'CSV', 'CAS', 'PAN')"
        }
    });

    // Create index for querying by sync status
    pgm.createIndex('user_portfolios', 'sync_status');
};

exports.down = (pgm) => {
    pgm.dropIndex('user_portfolios', 'sync_status');
    pgm.dropColumns('user_portfolios', ['last_synced_at', 'sync_status', 'sync_source']);
};

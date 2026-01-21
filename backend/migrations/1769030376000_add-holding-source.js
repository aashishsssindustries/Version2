/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Add source column to portfolio_holdings table
    pgm.addColumn('portfolio_holdings', {
        source: {
            type: 'varchar(20)',
            notNull: true,
            default: 'MANUAL',
            check: "source IN ('MANUAL', 'CSV', 'CAS', 'PAN')"
        }
    });

    // Backfill existing rows with 'MANUAL' (already done by default, but explicit)
    pgm.sql(`UPDATE portfolio_holdings SET source = 'MANUAL' WHERE source IS NULL`);

    // Create index for filtering by source
    pgm.createIndex('portfolio_holdings', 'source');
};

exports.down = (pgm) => {
    pgm.dropIndex('portfolio_holdings', 'source');
    pgm.dropColumn('portfolio_holdings', 'source');
};

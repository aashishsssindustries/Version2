/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Add new columns
    pgm.addColumn('users', {
        password_hash: { type: 'text' },
        role: { type: 'varchar(20)', default: 'user', notNull: true },
        pan_digest: { type: 'varchar(64)', unique: true }, // For duplication checks (SHA-256)
    });

    // We need to drop the unique constraint on 'pan' because encrypted values with random IVs won't match
    // and we want to use 'pan_digest' for uniqueness instead.
    // Default naming convention for unique constraint is extension of table_column_key usually.
    // However, node-pg-migrate might have named it differently. 
    // We'll try to drop the constraint by name 'users_pan_key'.
    pgm.dropConstraint('users', 'users_pan_key');

    // Change PAN column to text to support long encrypted strings
    pgm.alterColumn('users', 'pan', {
        type: 'text',
    });
};

exports.down = (pgm) => {
    pgm.dropColumn('users', ['password_hash', 'role', 'pan_digest']);
    // Note: Reverting pan from text to varchar(10) might fail if data is too long.
    // Restoring constraint also tricky without cleaning data.
};

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumns('profiles', {
        insurance_coverage: { type: 'decimal', default: 0 },
        action_items: { type: 'jsonb', default: '[]' }, // Stores generated recommendations
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('profiles', ['insurance_coverage', 'action_items']);
};

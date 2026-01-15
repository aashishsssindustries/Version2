/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumn('profiles', {
        asset_types: { type: 'jsonb', default: '[]' }, // Storing array of strings as JSONB
    });
};

exports.down = (pgm) => {
    pgm.dropColumn('profiles', ['asset_types']);
};

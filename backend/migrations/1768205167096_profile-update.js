/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumn('profiles', {
        monthly_emi: { type: 'decimal(15,2)', default: 0 },
        insurance_premium: { type: 'decimal(15,2)', default: 0 },
        persona_data: { type: 'jsonb', default: '{}' },
    });
};

exports.down = (pgm) => {
    pgm.dropColumn('profiles', ['monthly_emi', 'insurance_premium', 'persona_data']);
};

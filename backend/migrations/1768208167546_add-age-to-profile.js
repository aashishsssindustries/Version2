exports.up = (pgm) => {
    pgm.addColumns('profiles', {
        age: { type: 'integer', notNull: false, default: 30 }, // Default 30 to avoid breaking existing
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('profiles', ['age']);
};

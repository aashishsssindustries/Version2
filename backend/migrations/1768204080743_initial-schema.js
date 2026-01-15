/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Table: users
    pgm.createTable('users', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        email: { type: 'varchar(255)', notNull: true, unique: true },
        mobile: { type: 'varchar(20)', notNull: true, unique: true },
        name: { type: 'varchar(255)', notNull: true },
        pan: { type: 'varchar(10)', unique: true },
        is_email_verified: { type: 'boolean', default: false },
        is_mobile_verified: { type: 'boolean', default: false },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Table: profiles
    pgm.createTable('profiles', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            notNull: true,
            unique: true,
            references: '"users"',
            onDelete: 'CASCADE',
        },
        gross_income: { type: 'decimal(15,2)', default: 0 },
        fixed_expenses: { type: 'decimal(15,2)', default: 0 },
        total_liabilities: { type: 'decimal(15,2)', default: 0 },
        existing_assets: { type: 'decimal(15,2)', default: 0 },
        risk_score: { type: 'integer', default: 0 },
        risk_class: {
            type: 'varchar(50)',
            check: "risk_class IN ('Conservative', 'Moderate', 'Aggressive')",
        },
        health_score: { type: 'integer', default: 0 },
        checklist_status: { type: 'jsonb', default: '{}' },
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Table: survey_responses
    pgm.createTable('survey_responses', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            notNull: true,
            references: '"users"',
            onDelete: 'CASCADE',
        },
        responses: { type: 'jsonb', notNull: true },
        total_score: { type: 'integer', notNull: true },
        final_class: { type: 'varchar(50)', notNull: true },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Create indexes
    pgm.createIndex('users', 'email');
    pgm.createIndex('users', 'mobile');
    pgm.createIndex('profiles', 'user_id');
    pgm.createIndex('survey_responses', 'user_id');

    // Trigger for updated_at
    pgm.sql(`
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

    pgm.sql(`
    CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
  `);

    pgm.sql(`
    CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
  `);
};

exports.down = (pgm) => {
    pgm.dropTable('survey_responses');
    pgm.dropTable('profiles');
    pgm.dropTable('users');
    pgm.sql('DROP FUNCTION IF EXISTS update_modified_column CASCADE');
};

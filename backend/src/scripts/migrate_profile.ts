import db from '../config/database';

async function migrate() {
    console.log('Starting Schema Migration...');
    try {
        // Add pan_number column
        await db.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20);
        `);
        console.log('Added pan_number column');

        // Add employment_type column
        await db.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);
        `);
        console.log('Added employment_type column');

        console.log('Migration Completed Successfully');
    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        process.exit();
    }
}

migrate();


import db from '../src/config/database';


async function testConnection() {
    console.log('Testing database connection...');
    try {
        const isConnected = await db.testConnection();
        if (isConnected) {
            console.log('✅ Connection successful!');

            // Try to fetch users count
            const result = await db.query('SELECT COUNT(*) FROM users');
            console.log(`📊 Users count: ${result.rows[0].count}`);

            // Try to fetch 1 user to verify data access
            const user = await db.query('SELECT email, role, is_email_verified FROM users LIMIT 1');
            if (user.rows.length > 0) {
                console.log('👤 First user found:', user.rows[0]);
            } else {
                console.log('⚠️ No users found in database');
            }
        } else {
            console.error('❌ Connection failed (check logs for details)');
        }
    } catch (error) {
        console.error('💥 Critical error during test:', error);
    } finally {
        await db.close();
        process.exit(0);
    }
}

testConnection();

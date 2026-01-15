import db from '../src/config/database';

async function main() {
    try {
        console.log('Testing database connection...');
        const connected = await db.testConnection();
        if (connected) {
            console.log('SUCCESS: Database connected');
            process.exit(0);
        } else {
            console.error('FAILURE: Database connection failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('ERROR during connection test:', error);
        process.exit(1);
    }
}

main();

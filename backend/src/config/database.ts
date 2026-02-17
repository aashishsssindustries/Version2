import { Pool } from 'pg';
import config from './env';
import logger from './logger';

class Database {
    private static instance: Database;
    private pool: Pool;

    private constructor() {
        const dbUrl = config.get('DATABASE_URL');
        const isSupabase = dbUrl && dbUrl.includes('supabase');

        this.pool = new Pool({
            connectionString: dbUrl,
            ssl: isSupabase
                ? {
                    rejectUnauthorized: false,
                }
                : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });

        this.pool.on('connect', () => {
            logger.info('Database connection established');
        });

        this.pool.on('error', (err) => {
            logger.error('Unexpected database error', err);
        });
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public getPool(): Pool {
        return this.pool;
    }

    public async query(text: string, params?: any[]) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            logger.debug('Executed query', { text, duration, rows: result.rowCount });
            return result;
        } catch (error) {
            logger.error('Query error', { text, error });
            throw error;
        }
    }

    public async testConnection(): Promise<boolean> {
        try {
            await this.pool.query('SELECT NOW()');
            logger.info('Database connection test successful');
            return true;
        } catch (error) {
            logger.error('Database connection test failed', error);
            return false;
        }
    }

    public async close(): Promise<void> {
        await this.pool.end();
        logger.info('Database connection pool closed');
    }
}

export default Database.getInstance();

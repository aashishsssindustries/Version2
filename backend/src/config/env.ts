import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    CORS_ORIGIN: string;
    LOG_LEVEL: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_USER: string;
    SMTP_PASS: string;
    EMAIL_FROM: string;
}

class Config {
    private static instance: Config;
    private config: EnvConfig;

    private constructor() {
        this.config = {
            NODE_ENV: process.env.NODE_ENV || 'development',
            PORT: parseInt(process.env.PORT || '5000', 10),
            DATABASE_URL: process.env.DATABASE_URL || '',
            CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
            LOG_LEVEL: process.env.LOG_LEVEL || 'info',
            JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_prod',
            ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '01234567890123456789012345678901', // 32 chars for AES-256
            SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
            SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
            SMTP_SECURE: process.env.SMTP_SECURE === 'true',
            SMTP_USER: process.env.SMTP_USER || '',
            SMTP_PASS: process.env.SMTP_PASS || '',
            EMAIL_FROM: process.env.EMAIL_FROM || 'WealthMax <noreply@wealthmax.com>',
        };

        this.validate();
    }

    private validate() {
        if (!this.config.DATABASE_URL) {
            throw new Error('DATABASE_URL is required in environment variables');
        }
    }

    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
        return this.config[key];
    }

    public getAll(): EnvConfig {
        return { ...this.config };
    }

    public isDevelopment(): boolean {
        return this.config.NODE_ENV === 'development';
    }

    public isProduction(): boolean {
        return this.config.NODE_ENV === 'production';
    }
}

export default Config.getInstance();

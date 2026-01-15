import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import logger from './config/logger';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOrigin = config.get('CORS_ORIGIN') as string;
app.use(
    cors({
        origin: corsOrigin || (config.isDevelopment() ? ['http://localhost:5173', 'http://localhost:5174'] : undefined),
        credentials: true,
    })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
const morganFormat = config.isDevelopment() ? 'dev' : 'combined';
app.use(
    morgan(morganFormat, {
        stream: {
            write: (message: string) => logger.http(message.trim()),
        },
    })
);

// API routes
console.log('Mounting API Routes...');
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'WealthMax API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            code: 'NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

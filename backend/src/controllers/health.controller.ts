import { Request, Response } from 'express';
import database from '../config/database';

interface HealthResponse {
    success: boolean;
    message: string;
    timestamp: string;
    uptime: number;
}

interface DetailedHealthResponse extends HealthResponse {
    environment: string;
    database: {
        status: string;
        connected: boolean;
    };
}

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
    const response: HealthResponse = {
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };

    res.status(200).json(response);
};

export const getDetailedHealth = async (_req: Request, res: Response): Promise<void> => {
    const dbConnected = await database.testConnection();

    const response: DetailedHealthResponse = {
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: {
            status: dbConnected ? 'connected' : 'disconnected',
            connected: dbConnected,
        },
    };

    res.status(200).json(response);
};

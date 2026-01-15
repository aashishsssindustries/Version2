import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        details?: any;
    };
    timestamp: string;
}

class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code: string | undefined;
    let details: any;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
        details = err.details;
    }

    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    const response: ErrorResponse = {
        success: false,
        error: {
            message,
            ...(code && { code }),
            ...(details && { details }),
        },
        timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(response);
};

export { errorHandler, AppError };

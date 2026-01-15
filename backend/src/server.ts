import app from './app';
import config from './config/env';
import database from './config/database';
import logger from './config/logger';

const PORT = config.get('PORT');

const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await database.testConnection();
        if (!dbConnected) {
            logger.warn('Database connection failed, but server will start anyway');
        }

        // Start server
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} in ${config.get('NODE_ENV')} mode`);
            logger.info(`Health check available at http://localhost:${PORT}/api/v1/health`);
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await database.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await database.close();
    process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();

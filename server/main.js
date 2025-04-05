require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const createError = require('http-errors');
const { sequelize } = require('./models');
const routes = require('./routes');
const logger = require('./utils/logger');
const tempFiles = require('./utils/temp-files');

const app = express();
const PORT = process.env.PORT || 8000;

tempFiles.initTempDirectory();

app.use(cors({
    origin: ['http://localhost:63342', 'http://127.0.0.1:63342', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
    dest: tempFiles.getTempDirectory(),
    limits: {
        fileSize: 1024 * 1024 * 500 // 500 MB лимит
    }
});

app.use('/api', routes);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

app.use((req, res, next) => {
    next(createError(404, 'Endpoint not found'));
});

app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    if (err.stack) logger.error(err.stack);

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        error: true,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

async function checkDatabaseConnection() {
    try {
        await sequelize.authenticate();
        logger.info('Successfully connected to the database');
        return true;
    } catch (error) {
        logger.error(`Unable to connect to the database: ${error.message}`);
        return false;
    }
}

async function waitForDatabase(maxAttempts = 10, delayMs = 5000) {
    let attempts = 0;

    while (attempts < maxAttempts) {
        logger.info(`Attempt to connect to the database ${attempts + 1}/${maxAttempts}...`);
        const connected = await checkDatabaseConnection();

        if (connected) {
            return true;
        }

        attempts++;
        logger.info(`Failed to connect. Next attempt in ${delayMs / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    logger.error(`Failed to connect to the database after ${maxAttempts} attempts.`);
    return false;
}

// Запуск сервера
async function startServer() {
    try {
        const databaseConnected = await waitForDatabase();

        if (!databaseConnected) {
            logger.warn('Starting server without confirmed database connection.');
        }

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
}

process.on('uncaughtException', (err) => {
    logger.error(`Uncaught exception: ${err.message}`);
    logger.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:');
    logger.error(promise);
    logger.error(`Reason: ${reason}`);
    process.exit(1);
});

startServer();
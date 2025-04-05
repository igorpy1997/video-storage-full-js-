const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

let tempDir = path.join(os.tmpdir(), 'video-processing-server');


function initTempDirectory(customTempDir) {
    if (customTempDir) {
        tempDir = customTempDir;
    }

    if (!fs.existsSync(tempDir)) {
        try {
            fs.mkdirSync(tempDir, { recursive: true });
            logger.info(`Temporary directory created: ${tempDir}`);
        } catch (error) {
            logger.error(`Error creating temporary directory: ${error.message}`);
            throw error;
        }
    }

    return tempDir;
}


function getTempDirectory() {
    return tempDir;
}


function createTempFilePath(prefix = 'tmp', extension = '') {
    const fileName = `${prefix}-${uuidv4()}${extension}`;
    return path.join(tempDir, fileName);
}


function cleanupTempFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            logger.debug(`Temporary file deleted: ${filePath}`);
        } catch (error) {
            logger.error(`Error deleting temporary file: ${error.message}`);
        }
    }
}


function cleanupOldTempFiles(maxAge = 24 * 60 * 60 * 1000) { // По умолчанию 24 часа
    try {
        const now = Date.now();
        const files = fs.readdirSync(tempDir);

        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtime.getTime() > maxAge) {
                cleanupTempFile(filePath);
            }
        });

        logger.info('Cleanup of old temporary files completed');
    } catch (error) {
        logger.error(`Error cleaning up old temporary files: ${error.message}`);
    }
}

module.exports = {
    initTempDirectory,
    getTempDirectory,
    createTempFilePath,
    cleanupTempFile,
    cleanupOldTempFiles
};
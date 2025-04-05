const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const createError = require('http-errors');
let vercelBlob = null;

try {
    vercelBlob = require('@vercel/blob');
    logger.info('Successfully loaded @vercel/blob module');
} catch (error) {
    logger.error('Failed to load @vercel/blob module:', error.message);
}


function isBlobAvailable() {
    console.log('Process env:', process.env);
    console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN);
    console.log('BLOB_WRITE_TOKEN_vercel_blob:', process.env.BLOB_WRITE_TOKEN_vercel_blob);

    if (!vercelBlob) {
        logger.error('Vercel Blob module is not available');
        return false;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        logger.error('BLOB_READ_WRITE_TOKEN environment variable is not set');
        return false;
    }

    return true;
}


async function uploadFile(filePath, contentType, folder = 'videos') {
    if (!isBlobAvailable()) {
        throw createError(500, 'Vercel Blob Storage is not available');
    }

    try {
        logger.info(`Starting file upload to Vercel Blob Storage. File: ${filePath}`);

        // Создаем читающий поток
        const fileStream = fs.createReadStream(filePath);

        // Получаем расширение файла
        const fileExtension = path.extname(filePath).toLowerCase();

        // Генерируем уникальное имя файла
        const uniqueFilename = `${folder}/${uuidv4()}${fileExtension}`;
        logger.info(`Generated unique filename: ${uniqueFilename}`);

        // Загружаем файл в Vercel Blob Storage
        const result = await vercelBlob.put(uniqueFilename, fileStream, {
            access: 'public',
            contentType: contentType,
            multipart: true,
            onUploadProgress: (progress) => {
                logger.debug(`Upload progress: ${Math.round(progress.percentage)}%`);
            }
        });

        logger.info(`File successfully uploaded: ${result.url}`);

        return {
            url: result.url,
            pathname: result.pathname || uniqueFilename,
            content_type: contentType,
            size_bytes: result.size || fs.statSync(filePath).size
        };
    } catch (error) {
        logger.error(`Error uploading file to Vercel Blob Storage: ${error.message}`);
        throw createError(500, `Failed to upload to Blob storage: ${error.message}`);
    }
}


async function uploadThumbnail(filePath, videoId) {
    if (!isBlobAvailable()) {
        throw createError(500, 'Vercel Blob Storage is not available');
    }

    try {
        logger.info(`Uploading thumbnail. Path: ${filePath}, video ID: ${videoId}`);

        const fileExtension = path.extname(filePath).toLowerCase();
        const contentType = (fileExtension === '.jpg' || fileExtension === '.jpeg')
            ? 'image/jpeg'
            : 'image/png';

        const uniqueFilename = `thumbnails/${videoId}_${uuidv4()}${fileExtension}`;

        const fileContent = fs.readFileSync(filePath);

        const result = await vercelBlob.put(uniqueFilename, fileContent, {
            access: 'public',
            contentType: contentType
        });

        logger.info(`Thumbnail successfully uploaded: ${result.url}`);

        return result.url;
    } catch (error) {
        logger.error(`Error uploading thumbnail: ${error.message}`);
        throw createError(500, `Failed to upload thumbnail: ${error.message}`);
    }
}


async function deleteFile(url) {
    if (!isBlobAvailable()) {
        logger.error('Vercel Blob Storage is not available');
        return false;
    }

    try {
        logger.info(`Deleting file: ${url}`);

        const response = await vercelBlob.del(url);

        logger.info(`File deletion result:`, response);

        return true;
    } catch (error) {
        logger.error(`Error deleting file: ${error.message}`);
        return false;
    }
}


async function uploadFileFromForm(file, title) {
    if (!isBlobAvailable()) {
        throw createError(500, 'Vercel Blob Storage is not available');
    }

    try {
        logger.info(`Processing uploaded file: ${file.originalname}, size: ${file.size}`);

        const fileStream = fs.createReadStream(file.path);

        const fileExtension = path.extname(file.originalname).toLowerCase();

        const uniqueFilename = `videos/${uuidv4()}${fileExtension}`;

        logger.info(`Uploading file to Vercel Blob Storage: ${uniqueFilename}`);

        const blob = await vercelBlob.put(uniqueFilename, fileStream, {
            access: 'public',
            contentType: file.mimetype,
            multipart: true
        });

        logger.info(`File uploaded to Vercel Blob Storage: ${blob.url}`);

        fs.unlinkSync(file.path);

        return {
            blobUrl: blob.url,
            blobSize: blob.size || file.size,
            blobPathname: blob.pathname || uniqueFilename,
            title: title || `Video ${new Date().toISOString()}`,
            content_type: file.mimetype
        };
    } catch (error) {
        logger.error(`Error uploading file from form: ${error.message}`);
        try {
            if (file && file.path) {
                fs.unlinkSync(file.path);
            }
        } catch (unlinkError) {
            logger.error(`Error deleting temporary file: ${unlinkError.message}`);
        }

        throw createError(500, `Failed to upload file: ${error.message}`);
    }
}

module.exports = {
    isBlobAvailable,
    uploadFile,
    uploadThumbnail,
    deleteFile,
    uploadFileFromForm
};
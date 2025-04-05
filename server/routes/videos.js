const express = require('express');
const multer = require('multer');
const createError = require('http-errors');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const tempFiles = require('../utils/temp-files');
const blobService = require('../services/blob-service');
const videoProcessing = require('../services/video-processing');

const router = express.Router();

const upload = multer({
    dest: tempFiles.getTempDirectory(),
    limits: {
        fileSize: 1024 * 1024 * 500 // 500 MB лимит
    }
});


router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || null;

        if (page < 1) {
            throw createError(400, 'Page number must be greater than 0');
        }

        if (limit < 1 || limit > 100) {
            throw createError(400, 'Limit must be between 1 and 100');
        }

        const result = await videoProcessing.getVideos(page, limit, status);

        res.json(result);
    } catch (error) {
        next(error);
    }
});


router.post('/upload', upload.single('file'), async (req, res, next) => {
    try {
        logger.info('Handling video upload request');

        if (!req.file) {
            throw createError(400, 'No file provided');
        }

        const title = req.body.title || `Video ${new Date().toISOString()}`;

        const fileInfo = await blobService.uploadFileFromForm(req.file, title);

        const video = await videoProcessing.createVideo(
            { title: fileInfo.title },
            {
                url: fileInfo.blobUrl,
                content_type: fileInfo.content_type,
                size_bytes: fileInfo.blobSize,
                pathname: fileInfo.blobPathname
            }
        );

        setImmediate(() => {
            videoProcessing.processVideo(video.id)
                .catch(err => {
                    logger.error(`Async video processing error: ${err.message}`);
                });
        });

        res.status(202).json({
            id: video.id,
            title: video.title,
            message: 'Video upload successful'
        });
    } catch (error) {
        if (req.file && req.file.path) {
            tempFiles.cleanupTempFile(req.file.path);
        }
        next(error);
    }
});


router.post('/register', async (req, res, next) => {
    try {
        logger.info('Handling video registration request');

        const { blobUrl, title, blobSize, blobPathname } = req.body;

        if (!blobUrl) {
            throw createError(400, 'Missing required field: blobUrl');
        }

        const video = await videoProcessing.createVideo(
            { title: title || `Video ${new Date().toISOString()}` },
            {
                url: blobUrl,
                content_type: 'video/mp4', // По умолчанию или определите по расширению
                size_bytes: blobSize || 0,
                pathname: blobPathname || ''
            }
        );

        setImmediate(() => {
            videoProcessing.processVideo(video.id)
                .catch(err => {
                    logger.error(`Async video processing error: ${err.message}`);
                });
        });

        res.status(202).json({
            id: video.id,
            title: video.title,
            message: 'Video registration successful'
        });
    } catch (error) {
        next(error);
    }
});


router.get('/:id', async (req, res, next) => {
    try {
        const videoId = parseInt(req.params.id);

        if (isNaN(videoId) || videoId <= 0) {
            throw createError(400, 'Invalid video ID');
        }

        const video = await videoProcessing.getVideoById(videoId);

        res.json(video);
    } catch (error) {
        next(error);
    }
});


router.get('/:id/status', async (req, res, next) => {
    try {
        const videoId = parseInt(req.params.id);

        if (isNaN(videoId) || videoId <= 0) {
            throw createError(400, 'Invalid video ID');
        }

        const status = await videoProcessing.getVideoProcessingStatus(videoId);

        res.json(status);
    } catch (error) {
        next(error);
    }
});


router.delete('/:id', async (req, res, next) => {
    try {
        const videoId = parseInt(req.params.id);

        if (isNaN(videoId) || videoId <= 0) {
            throw createError(400, 'Invalid video ID');
        }

        await videoProcessing.deleteVideo(videoId);

        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
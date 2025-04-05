const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const tempFiles = require('../utils/temp-files');
const blobService = require('./blob-service');
const { Video, VideoProcessingJob } = require('../models');
const createError = require('http-errors');


async function createThumbnail(videoPath, videoId) {
    const thumbnailPath = tempFiles.createTempFilePath(`thumbnail-${videoId}`, '.jpg');

    return new Promise((resolve, reject) => {
        logger.info(`Creating thumbnail for video: ${videoPath}`);

        ffmpeg(videoPath)
            .on('error', (err) => {
                logger.error(`Error creating thumbnail: ${err.message}`);
                reject(err);
            })
            .on('end', () => {
                logger.info(`Thumbnail created: ${thumbnailPath}`);
                resolve(thumbnailPath);
            })
            .screenshots({
                count: 1,
                folder: path.dirname(thumbnailPath),
                filename: path.basename(thumbnailPath),
                size: '320x?',
                timestamps: ['10%']
            });
    });
}


function getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                logger.error(`Error getting video duration: ${err.message}`);
                reject(err);
                return;
            }

            const duration = Math.floor(metadata.format.duration || 0);
            logger.info(`Video duration: ${duration} seconds`);
            resolve(duration);
        });
    });
}


async function createVideo(videoData, fileInfo) {
    logger.info(`Creating video record in database`);
    logger.debug(`Video data:`, videoData);
    logger.debug(`File info:`, fileInfo);

    try {
        const video = await Video.create({
            title: videoData.title,
            file_path: fileInfo.url,
            thumbnail_path: '', // Обновится позже
            content_type: fileInfo.content_type,
            size_bytes: fileInfo.size_bytes,
            status: 'processing',
            upload_completed: true,
            processing_completed: false
        });

        logger.info(`Video record created with ID: ${video.id}`);

        const job = await VideoProcessingJob.create({
            video_id: video.id,
            job_status: 'pending',
            started_at: new Date()
        });

        logger.info(`Processing job created with ID: ${job.id}`);

        return video;
    } catch (error) {
        logger.error(`Error creating video record: ${error.message}`);
        throw createError(500, `Failed to create video record: ${error.message}`);
    }
}


async function processVideo(videoId) {
    logger.info(`Processing video with ID: ${videoId}`);

    const video = await Video.findByPk(videoId);
    if (!video) {
        logger.error(`Video with ID ${videoId} not found`);
        throw createError(404, 'Video not found');
    }

    const job = await VideoProcessingJob.findOne({
        where: { video_id: videoId },
        order: [['created_at', 'DESC']]
    });

    if (!job) {
        logger.error(`Processing job for video ID ${videoId} not found`);
        throw createError(404, 'Processing job not found');
    }

    await job.update({ job_status: 'processing' });

    let videoPath = null;
    let thumbnailPath = null;

    try {
        videoPath = tempFiles.createTempFilePath(`video-${videoId}`, path.extname(video.file_path));

        logger.info(`Downloading video from: ${video.file_path}`);

        await new Promise((resolve, reject) => {
            const https = require('https');
            const file = fs.createWriteStream(videoPath);

            https.get(video.file_path, (response) => {
                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    logger.info(`Video downloaded to: ${videoPath}`);
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(videoPath, () => {});
                logger.error(`Error downloading video: ${err.message}`);
                reject(err);
            });
        });

        thumbnailPath = await createThumbnail(videoPath, videoId);

        const duration = await getVideoDuration(videoPath);

        const thumbnailUrl = await blobService.uploadThumbnail(thumbnailPath, videoId);

        await video.update({
            thumbnail_path: thumbnailUrl,
            duration: duration,
            status: 'ready',
            processing_completed: true
        });

        await job.update({
            job_status: 'completed',
            completed_at: new Date()
        });

        logger.info(`Video processing completed for ID: ${videoId}`);
    } catch (error) {
        logger.error(`Error processing video: ${error.message}`);

        await job.update({
            job_status: 'failed',
            error_message: error.message,
            completed_at: new Date()
        });

        await video.update({
            status: 'error'
        });

        throw createError(500, `Error processing video: ${error.message}`);
    } finally {
        if (videoPath) tempFiles.cleanupTempFile(videoPath);
        if (thumbnailPath) tempFiles.cleanupTempFile(thumbnailPath);
    }
}


async function getVideos(page = 1, limit = 20, status = null) {
    logger.info(`Getting videos list. Page: ${page}, limit: ${limit}, status: ${status}`);

    const offset = (page - 1) * limit;

    const query = {
        offset,
        limit,
        order: [['created_at', 'DESC']]
    };

    if (status) {
        query.where = { status };
    }

    const { count, rows } = await Video.findAndCountAll(query);

    return {
        videos: rows,
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit)
    };
}


async function getVideoById(videoId) {
    logger.info(`Getting video by ID: ${videoId}`);

    const video = await Video.findByPk(videoId);

    if (!video) {
        logger.error(`Video with ID ${videoId} not found`);
        throw createError(404, 'Video not found');
    }

    return video;
}


async function getVideoProcessingStatus(videoId) {
    logger.info(`Getting processing status for video ID: ${videoId}`);

    const video = await Video.findByPk(videoId);

    if (!video) {
        logger.error(`Video with ID ${videoId} not found`);
        throw createError(404, 'Video not found');
    }

    const job = await VideoProcessingJob.findOne({
        where: { video_id: videoId },
        order: [['created_at', 'DESC']]
    });

    if (!job) {
        logger.error(`Processing job for video ID ${videoId} not found`);
        throw createError(404, 'Processing job not found');
    }

    return job;
}


async function deleteVideo(videoId) {
    logger.info(`Deleting video with ID: ${videoId}`);

    const video = await Video.findByPk(videoId);

    if (!video) {
        logger.error(`Video with ID ${videoId} not found`);
        throw createError(404, 'Video not found');
    }

    if (video.file_path) {
        await blobService.deleteFile(video.file_path);
    }

    if (video.thumbnail_path) {
        await blobService.deleteFile(video.thumbnail_path);
    }

    await video.destroy();

    logger.info(`Video with ID ${videoId} successfully deleted`);
}

module.exports = {
    createVideo,
    processVideo,
    getVideos,
    getVideoById,
    getVideoProcessingStatus,
    deleteVideo
};
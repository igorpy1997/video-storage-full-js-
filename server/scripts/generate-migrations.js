const path = require('path');
const fs = require('fs');
const { sequelize } = require('../models');

const migrationsDir = path.join(__dirname, '../migrations');

if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
}

function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generateVideoMigration() {
    const timestamp = getTimestamp();
    const filename = `${timestamp}-create-videos.js`;
    const filePath = path.join(migrationsDir, filename);

    const migrationContent = `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('videos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      thumbnail_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      size_bytes: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'processing'
      },
      upload_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      processing_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      video_uuid: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      parts_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('videos');
  }
};`;

    fs.writeFileSync(filePath, migrationContent);
    console.log(`Created migration file for Video model: ${filename}`);
    return filename;
}

function generateVideoProcessingJobMigration(videoMigrationTimestamp) {
    const timestamp = parseInt(videoMigrationTimestamp) + 1;
    const filename = `${timestamp}-create-video-processing-jobs.js`;
    const filePath = path.join(migrationsDir, filename);

    const migrationContent = `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('video_processing_jobs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      video_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'videos',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      job_status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
        allowNull: false
      },
      error_message: {
        type: Sequelize.STRING,
        allowNull: true
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('video_processing_jobs');
  }
};`;

    fs.writeFileSync(filePath, migrationContent);
    console.log(`Created migration file for VideoProcessingJob model: ${filename}`);
}

async function generateMigrations() {
    try {
        console.log('Starting migration files generation...');

        const existingMigrations = fs.readdirSync(migrationsDir);

        if (existingMigrations.length > 0) {
            console.log('Migrations already exist. Removing old files...');
            existingMigrations.forEach(file => {
                fs.unlinkSync(path.join(migrationsDir, file));
            });
        }

        const videoMigrationFilename = generateVideoMigration();
        const videoMigrationTimestamp = videoMigrationFilename.split('-')[0];
        generateVideoProcessingJobMigration(videoMigrationTimestamp);

        console.log('Migration generation completed successfully!');
    } catch (error) {
        console.error('Error during migration generation:', error);
    } finally {
        await sequelize.close();
    }
}

generateMigrations();
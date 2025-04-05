module.exports = (sequelize, DataTypes) => {
    const VideoProcessingJob = sequelize.define('VideoProcessingJob', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        video_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'videos',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        job_status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
            allowNull: false
        },
        error_message: {
            type: DataTypes.STRING,
            allowNull: true
        },
        started_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'video_processing_jobs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    VideoProcessingJob.associate = (models) => {
        VideoProcessingJob.belongsTo(models.Video, {
            foreignKey: 'video_id',
            as: 'video'
        });
    };

    return VideoProcessingJob;
};
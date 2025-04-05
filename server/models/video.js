module.exports = (sequelize, DataTypes) => {
    const Video = sequelize.define('Video', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        file_path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        thumbnail_path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        content_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        size_bytes: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'processing'
        },
        upload_completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        processing_completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        video_uuid: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        parts_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
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
        tableName: 'videos',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Video.associate = (models) => {
        Video.hasMany(models.VideoProcessingJob, {
            foreignKey: 'video_id',
            as: 'processing_jobs',
            onDelete: 'CASCADE'
        });
    };

    return Video;
};
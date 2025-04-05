require('dotenv').config();

module.exports = {
    username: process.env.PSQL_USER || 'postgres',
    password: process.env.PSQL_PASSWORD || 'postgres',
    database: process.env.PSQL_DB || 'video_app',
    host: process.env.DB_HOST || 'database',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
};
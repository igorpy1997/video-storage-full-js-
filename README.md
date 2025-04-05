# video-storage-full-js-

# Video Storage Full JS

A robust video storage and processing application built with Node.js, Express, PostgreSQL, and Vercel Blob Storage.

## Overview

This application provides a comprehensive solution for video uploads, processing, and management. Key features include:
- Direct video uploads to Vercel Blob Storage
- Automatic video processing (thumbnail generation, metadata extraction)
- Responsive web interface for video gallery
- Scalable and containerized architecture

## Prerequisites

- Docker
- Docker Compose
- Node.js (18+)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/video-storage-full-js.git
cd video-storage-full-js
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file and configure the following variables:
- `PSQL_USER`: PostgreSQL username
- `PSQL_PASSWORD`: PostgreSQL password
- `PSQL_DB`: Database name
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob Storage token
- `BLOB_STORE_ID`: Vercel Blob Store ID

### 3. Build and Start the Application

```bash
docker compose up -d --build
```

### 4. Database Migrations

Run database migrations:

```bash
docker exec -it video-storage-full-js--server-1 npm run db:generate
docker exec -it video-storage-full-js--server-1 npm run db:migrate
```

## Application Components

### Backend (Node.js/Express)
- RESTful API for video management
- Video processing services
- PostgreSQL database integration
- Logging with Winston

### Frontend
- Responsive video upload and gallery interface
- Drag-and-drop file upload
- Video preview and metadata display

### Infrastructure
- Docker containerization
- Caddy web server
- PostgreSQL database
- Vercel Blob Storage integration

## API Endpoints

- `GET /api/videos`: List videos
- `POST /api/videos/upload`: Upload a new video
- `GET /api/videos/:id`: Get video details
- `GET /api/videos/:id/status`: Check video processing status
- `DELETE /api/videos/:id`: Delete a video

## Development

### Available Scripts

- `npm run start`: Start the server
- `npm run dev`: Start server with nodemon
- `npm run db:generate`: Generate migration files
- `npm run db:migrate`: Run database migrations
- `npm run db:status`: Check migration status
- `npm run db:undo`: Revert last migration

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8000 |
| `PSQL_HOST` | PostgreSQL host | database |
| `PSQL_PORT` | PostgreSQL port | 5432 |
| `PSQL_USER` | PostgreSQL username | - |
| `PSQL_PASSWORD` | PostgreSQL password | - |
| `PSQL_DB` | Database name | video-storage |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Storage token | - |
| `BLOB_STORE_ID` | Vercel Blob Store ID | - |

## Logging

Logs are stored in the `server/logs` directory:
- `combined.log`: All logs
- `error.log`: Error logs

## Troubleshooting

- Ensure all environment variables are correctly set
- Check Docker container logs for detailed error messages
- Verify Vercel Blob Storage credentials



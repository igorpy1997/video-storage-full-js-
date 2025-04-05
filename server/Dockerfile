FROM node:18-alpine
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Копирование и установка зависимостей
COPY package*.json ./
RUN npm install

# Копирование основных файлов
COPY main.js ./
COPY models/ ./models/
COPY config/ ./config/
COPY scripts/ ./scripts/
COPY .sequelizerc ./
COPY routes ./routes/
COPY utils ./utils/
COPY services ./services/

RUN mkdir -p migrations

RUN mkdir -p /app/logs

EXPOSE 8000

CMD ["node", "main.js"]
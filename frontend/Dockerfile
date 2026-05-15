FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY preview-server.mjs ./
COPY src ./src

RUN npm run build:h5

EXPOSE 5174

CMD ["node", "preview-server.mjs"]

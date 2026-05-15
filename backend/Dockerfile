FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY public ./public

RUN npm run build

EXPOSE 3010

CMD ["node", "dist/main"]


FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

CMD ["npm", "run", "start:prod"]

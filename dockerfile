FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm i --ignore-scripts && npm run build && npm prune --develop
COPY . .

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY --from=builder /app/.env ./

# Exponha a porta em que o NestJS estará rodando (por padrão, 3000)
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["node", "dist/main"]

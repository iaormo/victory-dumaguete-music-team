# Victory Dumaguete Music Team - Production Dockerfile
# Author: Ian James Ormo

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --include=dev

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build:client
RUN npx tsc -p tsconfig.server.json

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN npx prisma generate

# Create uploads directory for persistent file storage
RUN mkdir -p /app/uploads

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist-server/index.js"]

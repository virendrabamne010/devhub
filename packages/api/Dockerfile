FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/database/package.json packages/database/
COPY packages/api/package.json packages/api/

RUN npm install --workspaces --ignore-scripts

COPY packages/database/ packages/database/
COPY packages/api/ packages/api/

RUN cd packages/database && npx prisma generate

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

COPY --chown=nodeuser:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nodeuser:nodejs --from=builder /app/package-lock.json ./package-lock.json
COPY --chown=nodeuser:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs --from=builder /app/packages/database ./packages/database
COPY --chown=nodeuser:nodejs --from=builder /app/packages/api ./packages/api

RUN cd packages/database && npx prisma generate

USER nodeuser

EXPOSE 3001

ENV NODE_ENV=development
ENV DATABASE_URL=file:/app/data/devhub.db

RUN mkdir -p /app/data && chown nodeuser:nodejs /app/data

CMD ["sh", "-c", "cd packages/database && DATABASE_URL=file:/app/data/devhub.db npx prisma migrate deploy && DATABASE_URL=file:/app/data/devhub.db NODE_ENV=development npx tsx prisma/seed.ts && cd /app && DATABASE_URL=file:/app/data/devhub.db npx tsx packages/api/src/index.ts"]

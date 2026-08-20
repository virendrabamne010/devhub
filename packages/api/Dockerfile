FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (workspaces so npm ci resolves)
COPY package.json package-lock.json ./
COPY packages/database/package.json packages/database/
COPY packages/api/package.json packages/api/

# Install dependencies
RUN npm install --workspaces --ignore-scripts

# Copy source code (web excluded via .dockerignore)
COPY packages/database/ packages/database/
COPY packages/api/ packages/api/

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# Copy everything needed (running via tsx handles TS + @devhub/database path alias)
COPY --chown=nodeuser:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nodeuser:nodejs --from=builder /app/package-lock.json ./package-lock.json
COPY --chown=nodeuser:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs --from=builder /app/packages/database ./packages/database
COPY --chown=nodeuser:nodejs --from=builder /app/packages/api ./packages/api

# Ensure Prisma client is generated inside node_modules for this stage
RUN cd packages/database && npx prisma generate

USER nodeuser

EXPOSE 3001

ENV NODE_ENV=production

# Run migrations, then start the API via tsx (resolves both TS and workspace aliases)
CMD ["sh", "-c", "cd packages/database && npx prisma migrate deploy && cd /app && npx tsx packages/api/src/index.ts"]

########################################
# Stage 1: Build
########################################
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

# Copy workspace root + each workspace's package.json first (cache layer)
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/

RUN npm ci

# Copy source and build
COPY tsconfig.base.json ./
COPY client/ client/
COPY server/ server/

RUN npm run build -w client && npm run build -w server

########################################
# Stage 2: Production runner
########################################
FROM node:20-alpine AS runner

WORKDIR /app

# Install build tools for better-sqlite3 (needed for npm install)
RUN apk add --no-cache python3 make g++

# Copy built artifacts
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/

# Install production deps for server only
WORKDIR /app/server
RUN npm install --omit=dev

# Remove build tools to slim down image
RUN apk del python3 make g++

WORKDIR /app

# Create data directory for SQLite
RUN mkdir -p /app/server/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/server/data/prompt-forge.db

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/templates || exit 1

CMD ["node", "server/dist/index.js"]

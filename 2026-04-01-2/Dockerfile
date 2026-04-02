FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++

# ---- Build client ----
FROM base AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# ---- Build server ----
FROM base AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ ./
RUN npx tsc

# ---- Production ----
FROM node:20-alpine AS production
RUN apk add --no-cache python3 make g++

WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force
RUN apk del python3 make g++

WORKDIR /app
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=client-build /app/client/dist ./client/dist

RUN mkdir -p /app/uploads /app/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/tracks || exit 1

WORKDIR /app/server
CMD ["node", "dist/index.js"]

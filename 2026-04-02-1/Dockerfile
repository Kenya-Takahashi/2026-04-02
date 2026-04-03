FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN npm ci

COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/
COPY packages/server/ packages/server/
COPY tsconfig.base.json ./

# Build client
RUN npm run build -w @seminar/client

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/server/ ./packages/server/
COPY --from=builder /app/packages/shared/ ./packages/shared/
COPY --from=builder /app/packages/client/dist/ ./packages/client/dist/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/package.json ./

RUN mkdir -p /data
ENV DATABASE_PATH=/data/seminar.db
EXPOSE 3000

CMD ["npx", "tsx", "packages/server/src/index.ts"]

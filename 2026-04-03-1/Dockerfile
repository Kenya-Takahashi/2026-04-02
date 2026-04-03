FROM node:20-alpine AS builder
WORKDIR /app
ARG APP_BASE_URL=https://appkenya.com/research-flow
ARG APP_BASE_PATH=/research-flow
ENV APP_BASE_URL=${APP_BASE_URL}
ENV APP_BASE_PATH=${APP_BASE_PATH}
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache sqlite
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

VOLUME ["/app/data"]
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_PATH=/app/data/research-flow.db
ENV APP_TIME_ZONE=Asia/Tokyo
ENV APP_BASE_URL=https://appkenya.com/research-flow
ENV APP_BASE_PATH=/research-flow
EXPOSE 3000
CMD ["node", "server.js"]

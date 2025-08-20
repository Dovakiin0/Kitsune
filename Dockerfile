FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json ./
RUN  npm install

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="Kitsune" \
  org.opencontainers.image.description="Anime streaming app" \
  org.opencontainers.image.maintainer="dovakiin0@kitsunee.online" \
  org.opencontainers.image.source="https://github.com/dovakiin0/Kitsune.git" \
  org.opencontainers.image.vendor="kitsunee.online"

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static/ ./.next/static/

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

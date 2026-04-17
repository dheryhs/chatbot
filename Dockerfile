# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Install OpenSSL 3.0 for Prisma
RUN apt-get update -y && \
    apt-get install -y openssl libssl3 && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Install OpenSSL 3.0 for Prisma
RUN apt-get update -y && \
    apt-get install -y openssl libssl3 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install OpenSSL 3.0 + ca-certificates for Prisma runtime
RUN apt-get update -y && \
    apt-get install -y openssl libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy Prisma client files from builder
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Add docker-entrypoint.sh and install prisma for migrations
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN npm install --no-save prisma @prisma/config && chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check untuk Easypanel monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
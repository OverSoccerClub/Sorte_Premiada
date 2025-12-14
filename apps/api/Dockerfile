
FROM node:20-alpine AS base

# Builder stage
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy all files
COPY . .

# Install all dependencies
RUN npm ci

# Generate Prisma Client
RUN npx turbo run db:generate

# Build
RUN npx turbo run build --filter=api...

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Copy built artifacts and necessary files
# We need to copy packages/database as well if it's a dependency
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
# Copy Prisma Client if needed explicitly, usually in node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database ./packages/database

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main"]

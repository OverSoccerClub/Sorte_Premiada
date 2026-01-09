
FROM node:20-alpine AS base

# Build Stage
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy all source code immediately to ensure full monorepo context
COPY . .

# Install dependencies
RUN npm ci --legacy-peer-deps

# Generate Prisma Client
RUN npx turbo run db:generate

# Disable telemetry
# ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npx turbo run build --filter=web...

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]

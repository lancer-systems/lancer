FROM node:22-alpine AS builder
WORKDIR /app

# Enable corepack and add pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for all packages
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
COPY packages/dashboard/package.json packages/dashboard/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared packages/shared
COPY packages/api packages/api
COPY packages/dashboard packages/dashboard

# Build dashboard (output goes to packages/api/public)
RUN pnpm --filter @lancer/dashboard build

# Production image
FROM node:22-alpine
WORKDIR /app

# Enable corepack and add pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy built application
COPY --from=builder /app/packages/api ./packages/api
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

WORKDIR /app/packages/api

# Data volume for SQLite database
VOLUME /app/packages/api/data

EXPOSE 3141

CMD ["node", "src/main.ts"]

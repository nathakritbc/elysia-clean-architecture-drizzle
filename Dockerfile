# Base image with Bun runtime for building and running the service
FROM oven/bun:1.2 AS base

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json ./
COPY bun.lockb* ./

# Install runtime dependencies (skips dev dependencies, keeps package.json untouched)
# Skip prepare script to avoid husky installation in production
RUN bun install --no-save --omit dev --force --ignore-scripts

# Copy the rest of the application source
COPY . .

# Expose application port
EXPOSE 7000

# Default environment
ENV NODE_ENV=production

# Start the Elysia server
CMD ["bun", "run", "src/index.ts"]

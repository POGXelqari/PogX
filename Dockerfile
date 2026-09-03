# ==============================================================================
# PogX Production Multi-Stage Dockerfile
# Optimized for Hyperlift / VPS / Docker deployments
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Obfuscate Frontend Bundle
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including dev build tools)
RUN npm ci

# Copy source code and scripts
COPY . .

# Execute production minification and obfuscation pipeline -> /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV WAITLIST_FILE=/app/data/waitlist.json

# Copy package descriptors
COPY package*.json ./

# Install production dependencies only (no dev tools in production image)
RUN npm ci --omit=dev

# Copy server code and production build output (unobfuscated frontend is NOT included!)
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Create persistent storage directory and set non-root ownership
RUN mkdir -p /app/data && chown -R node:node /app

# Run as non-root user
USER node

# Expose server port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/waitlist-count || exit 1

# Start the application
CMD ["node", "server.js"]

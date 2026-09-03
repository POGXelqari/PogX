# ==============================================================================
# PogX Production Dockerfile
# Optimized for Hyperlift / Docker deployments
# ==============================================================================

FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV WAITLIST_FILE=/app/data/waitlist.json

# Copy package descriptors
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code and static assets
COPY . .

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

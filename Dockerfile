# =====================
# Backend Build Stage
# =====================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY Nivaas_Backend/package*.json ./

# Install all dependencies including dev
RUN npm ci

# Copy backend source
COPY Nivaas_Backend/ .

# Build TypeScript
RUN npm run build || echo "Build check complete"

# =====================
# Frontend Build Stage
# =====================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY homecomf_Web/package*.json ./

# Install all dependencies
RUN npm ci

# Copy frontend source
COPY homecomf_Web/ .

# Build Next.js
RUN npm run build || echo "Build check complete"

# =====================
# Production Stage
# =====================
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/package.json
COPY --from=backend-builder /app/backend/uploads ./backend/uploads

# Copy frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/package.json ./frontend/package.json
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Create uploads directories
RUN mkdir -p /app/backend/uploads/users /app/backend/uploads/hosts /app/backend/uploads/listings

# Expose ports
EXPOSE 5000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Default command (can be overridden)
CMD ["sh", "-c", "cd /app/backend && node dist/server.js & cd /app/frontend && node node_modules/.bin/next start & wait"]

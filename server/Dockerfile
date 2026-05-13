# ─── Nexus Core: Server Engine ────────────────────────────────────────────────
FROM node:20-alpine AS base

# Install build dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Final stage
FROM node:20-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=base /app/node_modules ./node_modules
COPY . .

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3001

USER expressjs

EXPOSE 3001

CMD ["node", "index.js"]

FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN pnpm build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm

# Copy built artifacts (dist includes both server JS and dist/public frontend)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]

# syntax=docker/dockerfile:1
# Production image for the API. Build from the REPO ROOT (the monorepo is the context):
#   docker build -f api/Dockerfile -t urconnections-api .
# compose.prod.yml does this for you.
#
# Multi-stage build: stage 1 has the full toolchain (dev dependencies, esbuild) and
# produces api/dist; stage 2 starts again from a clean base and copies in only the built
# files plus production dependencies. The final image never contains the compiler,
# the TypeScript sources or the tests.

# Node 24 LTS on Debian slim. Not alpine: sharp and argon2 ship prebuilt binaries for
# glibc (Debian); on alpine's musl they would need extra packages or a compile step.
FROM node:24-bookworm-slim AS base
WORKDIR /app

# ── Stage 1: build ──────────────────────────────────────────────────────────────
FROM base AS build
# Copy only the manifests first. Docker caches each step: as long as these files don't
# change, the slow `npm ci` below is reused from cache even when the source code changes.
# npm needs every workspace's package.json to match the lockfile, so web's comes too.
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY packages/shared/package.json packages/shared/
COPY web/package.json web/
RUN npm ci --workspace @urconnections/api --include-workspace-root=false

COPY packages/shared/src packages/shared/src
COPY api/src api/src
COPY api/build.js api/
RUN npm run build --workspace @urconnections/api

# ── Stage 2: runtime ────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY packages/shared/package.json packages/shared/
COPY web/package.json web/
# --omit=dev: production dependencies only (no vitest, esbuild, types, ...).
RUN npm ci --omit=dev --workspace @urconnections/api --include-workspace-root=false \
  && npm cache clean --force

COPY --from=build /app/api/dist api/dist

WORKDIR /app/api
# SECURITY: run as the unprivileged "node" user that the base image provides, not root.
# If the API were ever compromised, the attacker would not be root inside the container.
USER node
EXPOSE 3000

# Docker (and compose's depends_on) ask this to decide whether the container is "healthy".
# The slim image has no curl, so use Node's built-in fetch.
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

# --enable-source-maps: error stack traces point at the TypeScript lines (dist/*.js.map).
CMD ["node", "--enable-source-maps", "dist/index.js"]

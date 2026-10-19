# syntax=docker/dockerfile:1
# Production image for the website. Build from the REPO ROOT:
#   docker build -f web/Dockerfile -t urconnections-web .
#
# Stage 1 uses Node to run `vite build`; stage 2 is just nginx plus the static files.
# The final image contains no Node, no node_modules, no source code.

# ── Stage 1: build ──────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json web/
COPY api/package.json api/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @urconnections/web --include-workspace-root=false

COPY tsconfig.base.json ./
COPY packages/shared/src packages/shared/src
COPY web/ web/
RUN npm run build --workspace @urconnections/web

# ── Stage 2: serve ──────────────────────────────────────────────────────────────
# SECURITY: the "unprivileged" nginx image runs as a normal user (not root) and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.30-alpine
COPY docker/nginx/web.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD ["wget", "-q", "--spider", "http://127.0.0.1:8080/"]

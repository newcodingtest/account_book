# Node is used only for building and verifying the static application.
FROM node:24.21.0-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html tsconfig.json vite.config.ts eslint.config.js playwright.config.ts ./
COPY src ./src
COPY public ./public
COPY tests ./tests
COPY e2e ./e2e
ARG VITE_SITE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL
RUN npm run lint && npm run typecheck && npm run test && npm run build

# Account runtime: Nginx serves HTTP only. Shared Caddy is deployed separately.
FROM nginx:1.30.6-alpine@sha256:ff8328b4279ec385af48cde9ef486e7165ad74b7065cb3cd86c377384e2e2dd5
COPY --from=build /app/dist /srv
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

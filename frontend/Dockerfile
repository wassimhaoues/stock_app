# ── Stage 1 : build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

# Cache node_modules before copying source
COPY package*.json ./
RUN npm ci --quiet

COPY . .
RUN npm run build -- --configuration=production

# ── Stage 2 : serve ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=build /app/dist/stockpro-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

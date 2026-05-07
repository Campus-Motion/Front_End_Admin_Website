# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3002
CMD ["serve", "-s", "dist", "-l", "3002"]
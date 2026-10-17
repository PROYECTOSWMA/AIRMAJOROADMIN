# ETAPA 1: Build - Construye la aplicación de producción
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1

# URL pública del tablero embebido. Al ser NEXT_PUBLIC_*, se incrusta en el
# bundle DURANTE el build, por eso debe pasarse como build arg (ver docker-compose.yml).
ARG NEXT_PUBLIC_BI_DASHBOARD_URL
ENV NEXT_PUBLIC_BI_DASHBOARD_URL=$NEXT_PUBLIC_BI_DASHBOARD_URL

RUN npm run build

# ETAPA 2: Production - Ejecuta la aplicación optimizada
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
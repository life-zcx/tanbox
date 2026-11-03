FROM node:22-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# Production Runtime
FROM node:22-alpine

RUN apk add --no-cache openssl libc6-compat postgresql-client chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto dumb-init

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/dist ./dist
COPY scripts ./scripts

EXPOSE 5050

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["sh", "-c", "node scripts/prepare-migrations.cjs && node_modules/.bin/prisma migrate deploy && exec node dist/index.js"]


# --- Build stage ---
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    RUN apk add --no-cache openssl
    
    # 1) deps sans scripts
    COPY package.json ./
    # COPY package-lock.json ./   # décommente si tu as un package-lock
    RUN npm ci --ignore-scripts || npm i --ignore-scripts
    
    # 2) code + prisma
    COPY . .
    RUN npx prisma generate
    
    # 3) build
    RUN npm run build
    
    # --- Runtime stage ---
    FROM node:20-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    RUN apk add --no-cache openssl
    
    COPY --from=builder /app/package.json ./package.json
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/prisma ./prisma
    COPY --from=builder /app/next.config.mjs ./next.config.mjs
    COPY --from=builder /app/src ./src
    
    CMD ["sh","-c","npx prisma migrate deploy && npx prisma db push && node node_modules/next/dist/bin/next start -p 3000"]    
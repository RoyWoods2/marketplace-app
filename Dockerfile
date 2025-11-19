FROM node:20-alpine

# Instalar OpenSSL y libc6-compat que Prisma necesita para PostgreSQL
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copiar package.json y prisma primero (para cache de Docker)
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Instalar Prisma CLI globalmente para evitar problemas de permisos
RUN npm install -g prisma@^5.7.1

# Generar Prisma Client
RUN prisma generate

# Copiar el resto del código del backend
COPY backend/ .

# Exponer puerto
EXPOSE 3000

# Ejecutar migraciones y empezar servidor
CMD ["sh", "-c", "prisma migrate deploy && npm start"]

